# Python Processing & Chunking Services

This folder houses the scalable Python-based document processing, chapter extraction, and roadmap generation utilities used by Charan Interiors and Openedup.

## Architecture & Layout

```
python/
├── src/
│   ├── __init__.py
│   ├── pdf_chapter_extractor.py  # High-performance PDF parser, chapter boundary detector & chunker
│   └── pdf_roadmap_generator.py  # Topic graph & interactive learning roadmap builder
├── pyproject.toml                # Python project configuration & linter rules (ruff)
├── requirements.txt              # Production dependency specifications
└── README.md                     # Documentation & usage guide
```

## Capabilities

1. **`pdf_chapter_extractor.py`**:
   - Parses multi-page PDF documents using `pymupdf` (with fallback to `pypdf` and raw byte heuristics).
   - Generates unified chapter boundaries, page offsets, and bounded text snippets for semantic grounding.
   - Rejects empty placeholder sections and flags scanned documents where OCR is required.

2. **`pdf_roadmap_generator.py`**:
   - Analyzes extracted chapters and builds milestone roadmaps.
   - Outputs JSON or Markdown topic graphs with checkpoint nodes and prerequisites.

## Setup & Running

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Extract document chapters
python3 src/pdf_chapter_extractor.py <path_to_pdf> [document_title]

# Generate roadmap
python3 src/pdf_roadmap_generator.py <path_to_pdf> --format json
```
