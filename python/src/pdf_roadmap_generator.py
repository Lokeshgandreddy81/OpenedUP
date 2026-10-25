#!/usr/bin/env python3
"""
pdf_roadmap_generator.py

Deterministic, zero-API-key Python script to extract learning roadmaps from PDF documents,
matching the structure of roadmap.sh (Phases, Nodes, Prerequisites, Checkpoints, Times).

Uses pdf_chapter_extractor for accurate, unified chapter boundaries,
TOC suppression, and full document page coverage without artificial page limits.
Requires NO LLM / NO API keys.

Usage:
    python3 scripts/pdf_roadmap_generator.py <path_to_pdf> [--format json|markdown]
"""

import sys
import os
import json
import re
from typing import List, Dict, Any, Optional
from collections import defaultdict, deque

# Add parent script dir to sys.path to import chapter extractor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from pdf_chapter_extractor import parse_with_pymupdf, parse_with_pypdf, parse_with_raw_bytes
    HAS_EXTRACTOR = True
except ImportError:
    HAS_EXTRACTOR = False

try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'[\r\n]+', ' ', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


def extract_roadmap_from_pdf(pdf_path: str, doc_title: Optional[str] = None) -> Dict[str, Any]:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    title = doc_title or os.path.splitext(os.path.basename(pdf_path))[0].replace("_", " ").title()
    raw_nodes = []

    # 1. Use the unified chapter extractor
    if HAS_EXTRACTOR:
        parsed = None
        if HAS_PYMUPDF:
            try:
                parsed = parse_with_pymupdf(pdf_path, doc_title or "")
            except Exception:
                parsed = None
        if not parsed and HAS_PYPDF:
            try:
                parsed = parse_with_pypdf(pdf_path, doc_title or "")
            except Exception:
                parsed = None
        if not parsed:
            try:
                parsed = parse_with_raw_bytes(pdf_path, doc_title or "")
            except Exception:
                parsed = None

        if parsed and parsed.get("chapters"):
            title = parsed.get("document_title") or title
            for idx, ch in enumerate(parsed["chapters"]):
                start_p = ch["start_page"]
                end_p = ch["end_page"]
                page_count = max(1, end_p - start_p + 1)
                words = ch.get("word_count", 0) or page_count * 250
                # ~160 wpm study pace
                est_min = max(3, round(words / 160))

                raw_nodes.append({
                    "id": f"node_{idx + 1}",
                    "title": ch["title"],
                    "level": 1 if ch.get("section_type") in ("front_matter", "back_matter") or "part" in ch["title"].lower() else 2,
                    "start_page": start_p,
                    "end_page": end_p,
                    "page_count": page_count,
                    "estimated_minutes": est_min,
                    "summary": ch.get("summary", ""),
                    "key_topics": ch.get("key_topics", []),
                    "section_type": ch.get("section_type", "chapter")
                })

    # Fallback to direct TOC outline if extractor was not found
    if not raw_nodes and HAS_PYMUPDF:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        toc = doc.get_toc()
        if toc and len(toc) >= 2:
            for idx, item in enumerate(toc):
                lvl, node_title, page = item[0], clean_text(item[1]), item[2]
                if not node_title:
                    continue
                next_page = total_pages
                if idx + 1 < len(toc):
                    next_page = max(page, toc[idx + 1][2] - 1)
                page_count = max(1, next_page - page + 1)
                raw_nodes.append({
                    "id": f"node_{idx + 1}",
                    "title": node_title,
                    "level": lvl,
                    "start_page": page,
                    "end_page": next_page,
                    "page_count": page_count,
                    "estimated_minutes": max(3, page_count * 2),
                    "summary": f"Topics covered from page {page} to {next_page}.",
                    "key_topics": [node_title]
                })

    # Ultimate fallback: synthetic milestone chapters
    if not raw_nodes:
        total = 10
        if HAS_PYMUPDF:
            try:
                total = len(fitz.open(pdf_path))
            except Exception:
                pass
        step = max(1, total // 5)
        for i, start_p in enumerate(range(1, total + 1, step)):
            end_p = min(total, start_p + step - 1)
            raw_nodes.append({
                "id": f"node_{i + 1}",
                "title": f"Part {i + 1}: Pages {start_p}–{end_p}",
                "level": 1,
                "start_page": start_p,
                "end_page": end_p,
                "page_count": end_p - start_p + 1,
                "estimated_minutes": max(3, (end_p - start_p + 1) * 2),
                "summary": f"Document content covering pages {start_p} to {end_p}.",
                "key_topics": [f"Part {i + 1}"]
            })

    # Group into roadmap.sh phases: Foundations, Core, Advanced
    total_nodes = len(raw_nodes)
    phases = [
        {"id": "phase-foundations", "title": "Phase 1: Foundations", "difficulty": "Beginner", "nodes": []},
        {"id": "phase-core", "title": "Phase 2: Core Concepts", "difficulty": "Intermediate", "nodes": []},
        {"id": "phase-advanced", "title": "Phase 3: Advanced Mastery", "difficulty": "Advanced", "nodes": []},
    ]

    for idx, node in enumerate(raw_nodes):
        ratio = idx / max(1, total_nodes - 1)
        target_phase = 0 if ratio < 0.3 else 1 if ratio < 0.7 else 2

        node["prerequisites"] = [raw_nodes[idx - 1]["id"]] if idx > 0 else []
        node["status"] = "todo"
        phases[target_phase]["nodes"].append(node)

    # Topological sort & cycle check (Pure Python Kahn's Algorithm)
    graph = defaultdict(list)
    in_degree = defaultdict(int)
    all_node_ids = set()

    for p in phases:
        for n in p["nodes"]:
            all_node_ids.add(n["id"])
            for prereq in n["prerequisites"]:
                graph[prereq].append(n["id"])
                in_degree[n["id"]] += 1

    queue = deque([n_id for n_id in all_node_ids if in_degree[n_id] == 0])
    ordered = []
    while queue:
        curr = queue.popleft()
        ordered.append(curr)
        for neighbor in graph[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    is_dag = len(ordered) == len(all_node_ids)

    return {
        "title": title,
        "is_valid_dag": is_dag,
        "total_steps": total_nodes,
        "total_estimated_minutes": sum(n.get("estimated_minutes", 5) for p in phases for n in p["nodes"]),
        "phases": phases,
    }


def to_markdown(roadmap: Dict[str, Any]) -> str:
    lines = [
        f"# Learning Roadmap: {roadmap['title']}",
        f"> {roadmap['total_steps']} Steps · ~{round(roadmap['total_estimated_minutes'] / 60, 1)} Hours Estimated\n",
    ]
    for phase in roadmap["phases"]:
        if not phase["nodes"]:
            continue
        lines.append(f"## {phase['title']} ({phase['difficulty']})")
        for node in phase["nodes"]:
            prereq_str = f" *(Requires: {node['prerequisites'][0]})*" if node["prerequisites"] else ""
            lines.append(
                f"- [ ] **{node['title']}** - `p. {node['start_page']}–{node['end_page']}` "
                f"(~{node['estimated_minutes']}m){prereq_str}"
            )
            if node.get("summary"):
                lines.append(f"  > {node['summary']}")
        lines.append("")
    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/pdf_roadmap_generator.py <path_to_pdf> [--format json|markdown]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    fmt = "json"
    if "--format" in sys.argv:
        idx = sys.argv.index("--format")
        if idx + 1 < len(sys.argv):
            fmt = sys.argv[idx + 1].lower()

    try:
        roadmap = extract_roadmap_from_pdf(pdf_path)
        if fmt == "markdown" or fmt == "md":
            print(to_markdown(roadmap))
        else:
            print(json.dumps(roadmap, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
