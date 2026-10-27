import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

import pymupdf

from pdf_page_renderer import DEFAULT_LIMITS, RenderError, RenderLimits, _render_pages

RENDERER = Path(__file__).parents[1] / "src" / "pdf_page_renderer.py"


def create_pdf(path: Path, page_count: int) -> None:
    document = pymupdf.open()
    for page_number in range(page_count):
        page = document.new_page(width=612, height=792)
        page.insert_text((72, 72), f"Test page {page_number + 1}")
    document.save(path)
    document.close()


class PdfPageRendererTests(unittest.TestCase):
    def test_renders_ordered_jpegs_within_dimension_limits(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            pdf_path = root / "fixture.pdf"
            output_dir = root / "images"
            create_pdf(pdf_path, 3)

            pages = _render_pages(pdf_path, output_dir, DEFAULT_LIMITS)

            self.assertEqual([page["pageNumber"] for page in pages], [1, 2, 3])
            for metadata in pages:
                self.assertEqual(metadata["mimeType"], "image/jpeg")
                self.assertLessEqual(max(metadata["width"], metadata["height"]), 1600)
                image_path = output_dir / metadata["fileName"]
                with pymupdf.open(image_path) as image_doc:
                    self.assertEqual(image_doc.page_count, 1)
                self.assertLessEqual(metadata["encodedByteCount"], 1_500_000)
            self.assertLessEqual(sum(page["encodedByteCount"] for page in pages), 8_000_000)

    def test_page_limit_rejects_without_creating_partial_images(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            pdf_path = root / "fixture.pdf"
            output_dir = root / "images"
            create_pdf(pdf_path, 3)

            with self.assertRaisesRegex(RenderError, "page_limit_exceeded"):
                _render_pages(pdf_path, output_dir, RenderLimits(max_pages=2))
            self.assertFalse(output_dir.exists())

    def test_aggregate_image_budget_rejects_without_partial_images(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            pdf_path = root / "fixture.pdf"
            output_dir = root / "images"
            create_pdf(pdf_path, 2)

            with self.assertRaisesRegex(RenderError, "image_budget_exceeded"):
                _render_pages(
                    pdf_path,
                    output_dir,
                    RenderLimits(max_total_base64_chars=10),
                )
            self.assertFalse(output_dir.exists())

    def test_cli_rejects_invalid_pdf_with_bounded_error(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            pdf_path = root / "invalid.pdf"
            output_dir = root / "images"
            pdf_path.write_bytes(b"not a pdf")

            result = subprocess.run(
                [sys.executable, str(RENDERER), str(pdf_path), str(output_dir)],
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 1)
            self.assertEqual(result.stderr.strip(), "invalid_pdf")
            self.assertFalse(output_dir.exists())

    def test_cli_returns_machine_readable_page_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            pdf_path = root / "fixture.pdf"
            output_dir = root / "images"
            create_pdf(pdf_path, 2)

            result = subprocess.run(
                [sys.executable, str(RENDERER), str(pdf_path), str(output_dir)],
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual([page["pageNumber"] for page in json.loads(result.stdout)["pages"]], [1, 2])


if __name__ == "__main__":
    unittest.main()
