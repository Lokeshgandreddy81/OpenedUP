#!/usr/bin/env python3
"""Render a small, bounded set of PDF pages as JPEGs for multimodal OCR."""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import fitz


@dataclass(frozen=True)
class RenderLimits:
    max_pages: int = 8
    max_edge: int = 1600
    max_image_base64_chars: int = 1_500_000
    max_total_base64_chars: int = 8_000_000


DEFAULT_LIMITS = RenderLimits()


class RenderError(Exception):
    """A bounded, user-safe PDF rendering failure."""


def _render_pages(pdf_path: Path, output_dir: Path, limits: RenderLimits) -> list[dict[str, Any]]:
    try:
        document = fitz.open(pdf_path)
    except Exception as exc:
        raise RenderError("invalid_pdf") from exc

    with document:
        if document.page_count < 1:
            raise RenderError("empty_pdf")
        if document.page_count > limits.max_pages:
            raise RenderError("page_limit_exceeded")

        pages = list(document)
        render_options = (
            (limits.max_edge, 70),
            (limits.max_edge, 55),
            (min(limits.max_edge, 1280), 60),
            (min(limits.max_edge, 1024), 50),
            (min(limits.max_edge, 768), 40),
        )
        for edge, quality in render_options:
            rendered: list[tuple[int, bytes, int, int]] = []
            total_base64_chars = 0
            fits = True
            for page in pages:
                bounds = page.rect
                scale = min(edge / bounds.width, edge / bounds.height) * 0.999
                pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
                jpeg_bytes = pixmap.tobytes("jpeg", jpg_quality=quality)
                encoded_size = 4 * ((len(jpeg_bytes) + 2) // 3)
                if (
                    max(pixmap.width, pixmap.height) > limits.max_edge
                    or encoded_size > limits.max_image_base64_chars
                ):
                    fits = False
                    break
                total_base64_chars += encoded_size
                if total_base64_chars > limits.max_total_base64_chars:
                    fits = False
                    break
                rendered.append((page.number + 1, jpeg_bytes, pixmap.width, pixmap.height))

            if fits and len(rendered) == document.page_count:
                output_dir.mkdir(parents=True, exist_ok=True)
                result = []
                for page_number, jpeg_bytes, width, height in rendered:
                    file_name = f"page-{page_number:04d}.jpg"
                    (output_dir / file_name).write_bytes(jpeg_bytes)
                    result.append(
                        {
                            "pageNumber": page_number,
                            "mimeType": "image/jpeg",
                            "fileName": file_name,
                            "width": width,
                            "height": height,
                            "encodedByteCount": 4 * ((len(jpeg_bytes) + 2) // 3),
                        }
                    )
                return result

    raise RenderError("image_budget_exceeded")


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        sys.stderr.write("usage: pdf_page_renderer.py <input.pdf> <output-directory>\n")
        return 2

    output_dir = Path(argv[2])
    try:
        pages = _render_pages(Path(argv[1]), output_dir, DEFAULT_LIMITS)
    except RenderError as exc:
        sys.stderr.write(f"{exc}\n")
        return 1
    except Exception:
        sys.stderr.write("render_failed\n")
        return 1

    sys.stdout.write(json.dumps({"pages": pages}, separators=(",", ":")) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
