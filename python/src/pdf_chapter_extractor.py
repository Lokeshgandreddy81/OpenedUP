#!/usr/bin/env python3
"""
pdf_chapter_extractor.py

Local, zero-API-key Python script for extracting structured chapters from PDF documents.
Uses PyMuPDF (fitz) with automatic fallback to pypdf, and zero-dependency raw byte parsing.

Extracts:
- Document title and total page count
- Document TOC/outline bookmarks (if present)
- Explicit chapter/section headings (via regex, typography, and visual heading detection)
- Smart multi-page printed Table of Contents grouping (suppressing TOC leakage)
- Semantic page partitioning for unstructured documents
- Clean text extraction, word counts, summaries, and key topics per chapter

Output:
ParsedPdfResult JSON printed to stdout.
"""

import sys
import os
import json
import re
import math
import collections

# ---------------------------------------------------------------------------
# Text & Decoration Normalization Utilities
# ---------------------------------------------------------------------------

def clean_text(text: str) -> str:
    """Normalizes whitespace and removes control characters."""
    if not text:
        return ""
    text = re.sub(r'[\r\n]+', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

def clean_markdown_decorations(text: str) -> str:
    """Strips leading/trailing markdown bold/italic asterisks, underscores, colons, and heading hashes."""
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'^\s*[*#_]+|\s*[*#_:]+$', '', t).strip()
    t = re.sub(r'^\s*[*_]{2}(.*?)[*_]{2}\s*[:]*$', r'\1', t).strip()
    return t.strip()

def is_footer_or_watermark(text: str) -> bool:
    """Detects running footers, page number lines, generator watermarks, and web URLs."""
    if not text:
        return False
    t = text.lower().strip()
    if re.search(r'\b(generated with|created with|powered by|printed by|kome\.ai|reportlab)\b', t):
        return True
    if re.match(r'^(?:page\s+\d+(\s+of\s+\d+)?|\d+\s+of\s+\d+|\d+)$', t):
        return True
    if len(t) < 80 and (re.match(r'^https?://', t) or re.match(r'^www\.', t) or re.search(r'\|\s*page\s+\d+', t)):
        return True
    return False

def is_dummy_title(title: str) -> bool:
    """Detects placeholder or generator default metadata titles."""
    if not title:
        return True
    t = title.lower().strip()
    return (
        t in {"(anonymous)", "anonymous", "unspecified", "untitled", "document", "unknown", "untitled document"}
        or t.startswith("shoebox_")
        or t.endswith(".pdf")
        or len(t) < 3
    )

def roman_to_int(s: str):
    """Converts a Roman numeral string to an integer, or returns None."""
    s = s.upper().strip()
    roman_map = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    if not re.match(r'^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$', s):
        return None
    total = 0
    for i in range(len(s)):
        val = roman_map.get(s[i], 0)
        next_val = roman_map.get(s[i + 1], 0) if i + 1 < len(s) else 0
        if val < next_val:
            total -= val
        else:
            total += val
    return total if total > 0 else None

# ---------------------------------------------------------------------------
# Regex Patterns for Chapter, Front-Matter & Back-Matter Detection
# ---------------------------------------------------------------------------

# Cleaned chapter keywords: handles optional bonus prefix, briefs, units, parts
CHAPTER_PREFIX_PATTERN = (
    r'(?:(?:bonus\s+)?(?:chapter|chap\.?|ch\.?|section|sec\.?|part|pt\.?|unit|module|mod\.?|'
    r'lesson|topic|week|wk\.?|lecture|lec\.?|'
    r'appendix|app\.?|annex|brief)|'
    r'capítulo|capitulo|cap\.?|sección|seccion|secc\.?|parte|unidad|módulo|modulo|'
    r'lección|leccion|tema|apéndice|apendice|chapitre|partie|unité|unite|leçon|lecon|'
    r'thème|theme|annexe|appendice|kapitel|abschnitt|teil|lektion|vorlesung|einheit|'
    r'anhang|sezione|lezione|argomento)'
)

CHAPTER_PREFIX_REGEX = re.compile(
    r'^(' + CHAPTER_PREFIX_PATTERN[3:] + r'\b\s*([0-9ivxlcdm]+|[a-z])\b[\s:.-]*(.*)',
    re.IGNORECASE
)

NUM_PREFIX_REGEX = re.compile(
    r'^([0-9]+)[\s:.-]+([A-Z][A-Za-z0-9\s,\'\"\-\u2013\u2014#\(\)/]{2,})',
    re.IGNORECASE
)

ROMAN_PREFIX_REGEX = re.compile(
    r'^([ivxlcdm]+)[\.:][\s]+([A-Z][A-Za-z0-9\s,\'\"\-\u2013\u2014#\(\)/]{2,})',
    re.IGNORECASE
)

FRONT_MATTER_PATTERN = (
    r'(?:table\s+of\s+contents|contents\b|brief\s+contents|table\s+des\s+matières|'
    r'inhaltsverzeichnis|índice|indice|preface|foreword|prologue|'
    r'acknowledgements?|dedication|executive\s+summary|abstract|'
    r'about\s+the\s+authors?|note\s+to\s+the\s+reader|preliminary\s+material|'
    r'front\s+matter)'
)

FRONT_MATTER_HEADING_REGEX = re.compile(
    r'^(' + FRONT_MATTER_PATTERN + r')(?:[\s:.-]+(.*))?$',
    re.IGNORECASE
)

BACK_MATTER_PATTERN = (
    r'(?:appendix(?:\s+[a-z0-9]+)?|appendices|annex(?:\s+[a-z0-9]+)?|'
    r'apéndice(?:\s+[a-z0-9]+)?|apendice|annexe|appendice|anhang(?:\s+[a-z0-9]+)?|'
    r'bibliography|references|works\s+cited|further\s+reading|'
    r'index|subject\s+index|author\s+index|'
    r'glossary|notes|endnotes|source\s+notes|'
    r'epilogue|afterword|postscript|colophon|back\s+matter|'
    r'summary\s+of\s+expertise(?:\s+levels)?|summary\s+of\s+skills)'
)

BACK_MATTER_HEADING_REGEX = re.compile(
    r'^(' + BACK_MATTER_PATTERN + r')(?:[\s:.-]+(.*))?$',
    re.IGNORECASE
)

TOC_TITLE_REGEX = re.compile(
    r'\b(?:table\s+of\s+contents|brief\s+contents|contents\b)\b',
    re.IGNORECASE
)

KEYWORD_NORM = {
    'ch': 'Chapter', 'chap': 'Chapter', 'sec': 'Section', 'pt': 'Part',
    'mod': 'Module', 'wk': 'Week', 'lec': 'Lecture', 'vol': 'Volume',
    'app': 'Appendix', 'appendix': 'Appendix', 'annex': 'Annex',
    'cap': 'Chapter', 'capitulo': 'Chapter', 'capítulo': 'Chapter',
    'chapitre': 'Chapter', 'kapitel': 'Chapter',
    'seccion': 'Section', 'sección': 'Section', 'abschnitt': 'Section',
    'teil': 'Part', 'parte': 'Part', 'partie': 'Part',
    'unidad': 'Unit', 'unité': 'Unit', 'unite': 'Unit', 'einheit': 'Unit',
    'modulo': 'Module', 'módulo': 'Module',
    'leccion': 'Lesson', 'lección': 'Lesson', 'lecon': 'Lesson', 'leçon': 'Lesson',
    'lektion': 'Lesson', 'vorlesung': 'Lecture', 'lezione': 'Lecture'
}

def classify_section_title(title: str) -> str:
    """Classifies a section title as 'front_matter', 'back_matter', or 'chapter'."""
    if not title:
        return "chapter"
    cleaned = title.strip().lower()
    if re.search(r'\b' + FRONT_MATTER_PATTERN + r'\b', cleaned):
        return "front_matter"
    if re.search(r'\b' + BACK_MATTER_PATTERN + r'\b', cleaned):
        return "back_matter"
    return "chapter"

def extract_chapter_number_and_name(heading: str, fallback_index: int):
    """
    Extracts an integer chapter number and cleaned title from a heading line.
    Cleans up artifact colons, em-dashes, and markdown decorators.
    """
    cleaned = clean_markdown_decorations(heading)

    # Front-matter check (e.g. "Preface", "Table of Contents")
    m_fm = FRONT_MATTER_HEADING_REGEX.match(cleaned)
    if m_fm:
        matched_kw = m_fm.group(1).strip().title()
        rest = re.sub(r'^[—–\s:.-]+', '', m_fm.group(2) or "").strip()
        title = f"{matched_kw}: {rest}" if rest else matched_kw
        return fallback_index, title

    m = CHAPTER_PREFIX_REGEX.match(cleaned)
    if m:
        raw_kw = m.group(1).lower().rstrip('.')
        num_str = m.group(2)
        rest = re.sub(r'^[—–\s:.-]+', '', m.group(3) or "").strip()
        kw = KEYWORD_NORM.get(raw_kw, raw_kw.capitalize())

        if num_str.isdigit():
            num = int(num_str)
            title = f"{kw} {num}: {rest}" if rest else f"{kw} {num}"
            return num, title
        elif len(num_str) == 1 and num_str.isalpha():
            let = num_str.upper()
            title = f"{kw} {let}: {rest}" if rest else f"{kw} {let}"
            return fallback_index, title
        else:
            num = roman_to_int(num_str) or fallback_index
            title = f"{kw} {num}: {rest}" if rest else f"{kw} {num}"
            return num, title

    # Leading digit match: "1. Introduction" or "1 - Overview"
    m_num = NUM_PREFIX_REGEX.match(cleaned)
    if m_num:
        num = int(m_num.group(1))
        rest = re.sub(r'^[—–\s:.-]+', '', m_num.group(2) or "").strip()
        title = f"{num}. {rest}" if rest else f"Chapter {num}"
        return num, title

    # Leading Roman numeral: "IV. Methodology" or "IV: Methodology"
    m_rom = ROMAN_PREFIX_REGEX.match(cleaned)
    if m_rom:
        r_val = roman_to_int(m_rom.group(1))
        if r_val and r_val <= 50:
            rest = re.sub(r'^[—–\s:.-]+', '', m_rom.group(2) or "").strip()
            title = f"Chapter {r_val}: {rest}" if rest else f"Chapter {r_val}"
            return r_val, title

    return fallback_index, cleaned if cleaned else f"Chapter {fallback_index}"

# ---------------------------------------------------------------------------
# Outline (TOC Bookmark) Selection
# ---------------------------------------------------------------------------

def select_optimal_toc_markers(toc: list, total_pages: int) -> list:
    """
    Intelligently extracts chapter-level markers from a PDF Table of Contents (outline).
    Handles multi-level outlines, root wrappers, mixed hierarchy, and start-page normalization.
    """
    if not toc:
        return []

    cleaned_toc = []
    for item in toc:
        if not isinstance(item, (list, tuple)) or len(item) < 3:
            continue
        try:
            lvl = int(item[0])
            title = clean_markdown_decorations(str(item[1]).strip())
            page = int(item[2])
        except (ValueError, TypeError):
            continue
        if not title or page < 1:
            continue
        page = min(page, total_pages)
        cleaned_toc.append((lvl, title, page))

    if not cleaned_toc:
        return []

    levels = sorted(list(set(item[0] for item in cleaned_toc)))
    items_by_level = {l: [it for it in cleaned_toc if it[0] == l] for l in levels}

    # If min level has only 1 item (usually document title/wrapper) and deeper levels have >= 2 items, bypass wrapper
    curr_min = levels[0]
    while curr_min in items_by_level and len(items_by_level[curr_min]) == 1:
        deeper = [l for l in levels if l > curr_min]
        if deeper and any(len(items_by_level[l]) >= 2 for l in deeper):
            curr_min = deeper[0]
        else:
            break

    lvl1_items = items_by_level.get(curr_min, [])
    lvl2_items = items_by_level.get(curr_min + 1, [])

    chapter_kw = re.compile(
        r'\b' + CHAPTER_PREFIX_PATTERN + r'\b[\s:.-]*([0-9ivxlcdm]+|[a-z])|\b\d+[\s:.-]+[A-Za-z]',
        re.I
    )
    has_parts_lvl1 = any(re.match(r'^(?:part|unit|book|volume)\b', it[1], re.I) for it in lvl1_items)
    has_ch_lvl2 = any(chapter_kw.search(it[1]) for it in lvl2_items)

    should_expand = (
        (len(lvl1_items) <= 6 and len(lvl2_items) >= 2) or
        (has_parts_lvl1 and len(lvl2_items) >= 2) or
        (not any(chapter_kw.search(it[1]) for it in lvl1_items) and has_ch_lvl2)
    )

    selected_raw = []
    n = len(cleaned_toc)

    if should_expand and lvl2_items:
        for idx in range(n):
            lvl, title, page = cleaned_toc[idx]
            if lvl < curr_min:
                continue
            elif lvl == curr_min:
                has_child = False
                for j in range(idx + 1, n):
                    if cleaned_toc[j][0] <= curr_min:
                        break
                    if cleaned_toc[j][0] == curr_min + 1:
                        has_child = True
                        break
                if not has_child:
                    selected_raw.append((title, page))
            elif lvl == curr_min + 1:
                selected_raw.append((title, page))
    else:
        best_lvl = curr_min
        if len(lvl1_items) < 2:
            for l in levels:
                if len(items_by_level[l]) >= 2:
                    best_lvl = l
                    break
        selected_raw = [(it[1], it[2]) for it in items_by_level.get(best_lvl, cleaned_toc)]

    # Preserve order and deduplicate identical title+page pairs
    seen = set()
    markers = []
    for idx, (title, page) in enumerate(selected_raw):
        if is_footer_or_watermark(title):
            continue
        key = (title.lower(), page)
        if key in seen:
            continue
        seen.add(key)
        ch_num, formatted = extract_chapter_number_and_name(title, idx + 1)
        sec_type = classify_section_title(formatted)
        markers.append({
            "start_page": page,
            "title": formatted,
            "chapter_number": ch_num,
            "is_explicit": True,
            "section_type": sec_type
        })

    return markers

# ---------------------------------------------------------------------------
# Visual Layout & Typography Heading Detection
# ---------------------------------------------------------------------------

def detect_visual_headings_pymupdf(doc, total_pages: int, doc_title: str = "") -> list:
    """
    Layout and typography analysis via PyMuPDF get_text('dict').
    Detects consistent chapter headings based on font size and boldness across pages.
    Excludes cover page from target size calculations to avoid title pollution.
    """
    font_char_counts = collections.Counter()
    page_texts_occurrence = collections.defaultdict(list)

    sample_pages = range(total_pages) if total_pages <= 50 else [int(i * (total_pages - 1) / 49) for i in range(50)]

    for pg_idx in sample_pages:
        try:
            pg = doc[pg_idx]
            page_dict = pg.get_text("dict")
        except Exception:
            continue
        for b in page_dict.get("blocks", []):
            if b.get("type") != 0:
                continue
            for line in b.get("lines", []):
                spans = line.get("spans", [])
                line_str = "".join(s.get("text", "") for s in spans).strip()
                if not line_str:
                    continue
                page_texts_occurrence[line_str.lower()].append(pg_idx)
                for s in spans:
                    sz = round(float(s.get("size", 10.0)), 1)
                    txt = s.get("text", "")
                    if txt.strip():
                        font_char_counts[sz] += len(txt)

    if not font_char_counts:
        return []

    body_font_size = font_char_counts.most_common(1)[0][0]
    min_heading_size = max(body_font_size * 1.2, body_font_size + 2.0)

    # Filter running headers/footers repeated across 3 or more sampled pages
    running_headers = set(
        txt for txt, pgs in page_texts_occurrence.items() if len(set(pgs)) >= 3
    )

    candidates = []

    for pg_idx in range(total_pages):
        # Exclude page 1 (cover) from candidate heading pool if document is multi-page
        if pg_idx == 0 and total_pages > 1:
            continue

        try:
            pg = doc[pg_idx]
            page_dict = pg.get_text("dict")
        except Exception:
            continue

        h = page_dict.get("height", 842)

        for b in page_dict.get("blocks", []):
            if b.get("type") != 0:
                continue
            # Headings must appear in top 40% of the page
            bbox = b.get("bbox", [0, 0, 0, 0])
            if bbox[1] > h * 0.40:
                continue

            lines = b.get("lines", [])
            for line in lines:
                spans = [s for s in line.get("spans", []) if s.get("text", "").strip()]
                if not spans:
                    continue

                line_txt = " ".join(s["text"].strip() for s in spans).strip()
                if not line_txt or len(line_txt) < 3 or len(line_txt) > 110:
                    continue

                if is_footer_or_watermark(line_txt) or line_txt.lower() in running_headers:
                    continue

                tot_len = sum(len(s["text"]) for s in spans)
                avg_sz = sum(float(s["size"]) * len(s["text"]) for s in spans) / max(1, tot_len)
                is_bold = any((s.get("flags", 0) & 16 != 0) or ("bold" in s.get("font", "").lower()) for s in spans)

                if avg_sz >= min_heading_size or (is_bold and avg_sz >= body_font_size * 1.12):
                    candidates.append((pg_idx + 1, round(avg_sz, 1), is_bold, line_txt))

    if not candidates:
        return []

    # Clean and filter candidates
    doc_title_clean = doc_title.lower().strip()
    valid_candidates = []
    for pg, sz, bold, txt in candidates:
        if not re.search(r'[A-Za-z]', txt):
            continue
        if doc_title_clean and (txt.lower() == doc_title_clean or doc_title_clean in txt.lower()):
            continue
        valid_candidates.append((pg, sz, bold, txt))

    if not valid_candidates:
        return []

    # Group by font size to find consistent chapter headings appearing across >= 2 pages
    size_freq = collections.Counter(c[1] for c in valid_candidates)
    sorted_sizes = sorted(size_freq.keys(), reverse=True)

    target_size = None
    for sz in sorted_sizes:
        matching = [c for c in valid_candidates if abs(c[1] - sz) <= 1.2]
        matching_pages = set(c[0] for c in matching)
        if len(matching_pages) >= 2:
            target_size = sz
            break

    if target_size is None and sorted_sizes:
        target_size = sorted_sizes[0]

    selected = [c for c in valid_candidates if abs(c[1] - target_size) <= 1.5]

    by_page = {}
    for pg, sz, bold, txt in selected:
        if pg not in by_page or sz > by_page[pg][0]:
            by_page[pg] = (sz, txt)

    markers = []
    for idx, pg in enumerate(sorted(by_page.keys())):
        _, txt = by_page[pg]
        ch_num, formatted = extract_chapter_number_and_name(txt, idx + 1)
        sec_type = classify_section_title(formatted)
        markers.append({
            "start_page": pg,
            "title": formatted,
            "chapter_number": ch_num,
            "is_explicit": True,
            "section_type": sec_type
        })

    return markers

# ---------------------------------------------------------------------------
# Semantic Partitioning Fallback for Unstructured Documents
# ---------------------------------------------------------------------------

def extract_section_semantic_title(text: str, section_idx: int) -> str:
    """Extracts a clean, informative title for an unstructured section."""
    if not text:
        return f"Section {section_idx}"

    cap_phrases = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b', text[:2500])
    stops = {
        "The", "This", "That", "These", "Those", "Here", "There", "From", "With",
        "Section", "Chapter", "Page", "Figure", "Table", "Author", "Journal", "Volume", "Number"
    }
    good_caps = [p for p in cap_phrases if p.split()[0] not in stops and 5 < len(p) < 45]
    if good_caps:
        most_common_cap = collections.Counter(good_caps).most_common(1)[0][0]
        return f"Section {section_idx}: {most_common_cap}"

    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    common = {
        "this", "that", "with", "from", "have", "were", "which", "page", "about",
        "also", "their", "there", "they", "been", "would", "could", "some", "other",
        "into", "more", "these", "first", "such", "when", "than", "them", "then", "only"
    }
    filtered = [w.capitalize() for w in words if w not in common]
    if filtered:
        top2 = [w for w, _ in collections.Counter(filtered).most_common(2)]
        return f"Section {section_idx}: {' & '.join(top2)}"

    return f"Section {section_idx}"

def partition_unstructured_pages(page_texts: list, total_pages: int, doc_title: str = "") -> list:
    """Semantically partitions an unstructured document via lexical topic-shift dissimilarity."""
    if total_pages <= 1:
        return [{
            "start_page": 1,
            "title": doc_title or "Section 1",
            "chapter_number": 1,
            "is_explicit": False,
            "section_type": "chapter"
        }]
    if total_pages <= 3:
        markers = []
        for p in range(1, total_pages + 1):
            t = page_texts[p - 1] if p - 1 < len(page_texts) else ""
            title = extract_section_semantic_title(t, p)
            markers.append({
                "start_page": p,
                "title": title,
                "chapter_number": p,
                "is_explicit": False,
                "section_type": "chapter"
            })
        return markers

    stops = {
        "the", "and", "for", "this", "that", "with", "from", "have", "were",
        "which", "page", "about", "also", "their", "there", "they", "been"
    }
    page_tokens = []
    page_word_counts = []
    for txt in page_texts:
        tokens = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', txt.lower()) if w not in stops]
        page_tokens.append(collections.Counter(tokens))
        page_word_counts.append(len(txt.split()))

    avg_words = sum(page_word_counts) / max(1, len(page_word_counts))

    def cosine_sim(c1, c2):
        inter = set(c1.keys()) & set(c2.keys())
        if not inter:
            return 0.0
        dot = sum(c1[w] * c2[w] for w in inter)
        norm1 = math.sqrt(sum(v**2 for v in c1.values()))
        norm2 = math.sqrt(sum(v**2 for v in c2.values()))
        return dot / (norm1 * norm2) if (norm1 * norm2) > 0 else 0.0

    target_sections = min(24, max(2, round(total_pages / 6.5)))
    min_spacing = max(2, min(6, math.floor(total_pages / (target_sections * 1.5))))

    scores = []
    for p in range(1, total_pages):
        c_left = collections.Counter()
        for idx in range(max(0, p - 2), p):
            if idx < len(page_tokens):
                c_left.update(page_tokens[idx])
        c_right = collections.Counter()
        for idx in range(p, min(total_pages, p + 2)):
            if idx < len(page_tokens):
                c_right.update(page_tokens[idx])

        sim = cosine_sim(c_left, c_right)
        dissim = 1.0 - sim
        early_end = (
            p - 1 < len(page_word_counts)
            and page_word_counts[p - 1] < 0.45 * avg_words
            and avg_words > 20
        )
        score = dissim + (0.35 if early_end else 0.0)
        scores.append((p + 1, score))

    scores.sort(key=lambda x: x[1], reverse=True)
    selected_pages = [1]
    for page_num, sc in scores:
        if len(selected_pages) >= target_sections:
            break
        if all(abs(page_num - sp) >= min_spacing for sp in selected_pages):
            selected_pages.append(page_num)

    selected_pages.sort()
    markers = []
    for idx, sp in enumerate(selected_pages):
        ep = selected_pages[idx + 1] - 1 if idx + 1 < len(selected_pages) else total_pages
        section_txt = " ".join(page_texts[sp - 1 : ep]) if sp - 1 < len(page_texts) else ""
        title = extract_section_semantic_title(section_txt, idx + 1)
        markers.append({
            "start_page": sp,
            "title": title,
            "chapter_number": idx + 1,
            "is_explicit": False,
            "section_type": "chapter"
        })

    return markers

# ---------------------------------------------------------------------------
# Front and Back Matter Assurance
# ---------------------------------------------------------------------------

def ensure_front_and_back_matter(markers: list, page_texts: list, total_pages: int) -> list:
    """
    Ensures front-matter (Cover, TOC, Preface) and back-matter (Appendices, Index)
    are recognized as distinct sections without overwriting author chapter numbers.
    """
    if not markers:
        return markers

    markers = sorted(markers, key=lambda m: m["start_page"])
    seen_pages = set(m["start_page"] for m in markers)

    # 1. Front-Matter Check: Are pages before the first explicit chapter unaccounted for?
    first_sp = markers[0]["start_page"]
    if first_sp > 1:
        found_front_markers = []
        last_fm_kw = None
        for p in range(1, first_sp):
            txt = page_texts[p - 1] if p - 1 < len(page_texts) else ""
            lines = [clean_markdown_decorations(l.strip()) for l in txt.split('\n') if l.strip()]
            for l_idx, line in enumerate(lines[:8]):
                if is_footer_or_watermark(line):
                    continue
                m_fm = FRONT_MATTER_HEADING_REGEX.match(line)
                if len(line) <= 80 and m_fm and not line.endswith('.'):
                    matched_kw = m_fm.group(1).strip().lower()
                    if matched_kw == last_fm_kw:
                        break
                    last_fm_kw = matched_kw

                    raw_title = line
                    if len(line.split()) <= 2 and l_idx + 1 < len(lines):
                        nxt = lines[l_idx + 1]
                        if len(nxt) <= 80 and not nxt.endswith('.') and not FRONT_MATTER_HEADING_REGEX.match(nxt):
                            raw_title = f"{line.title()}: {nxt}"
                    else:
                        raw_title = raw_title.title()

                    if p not in seen_pages:
                        seen_pages.add(p)
                        found_front_markers.append({
                            "start_page": p,
                            "title": raw_title,
                            "chapter_number": len(found_front_markers) + 1,
                            "is_explicit": True,
                            "section_type": "front_matter"
                        })
                    break

        if 1 not in seen_pages and total_pages > 1:
            seen_pages.add(1)
            first_pg_txt = (page_texts[0] if page_texts else "").lower()
            if "table of contents" in first_pg_txt or "contents" in first_pg_txt:
                synth_title = "Table of Contents"
            elif "preface" in first_pg_txt:
                synth_title = "Preface"
            else:
                synth_title = "Cover & Overview"

            found_front_markers.insert(0, {
                "start_page": 1,
                "title": synth_title,
                "chapter_number": 1,
                "is_explicit": False,
                "section_type": "front_matter"
            })

        markers = found_front_markers + markers

    # 2. Back-Matter Check: Are trailing pages after the last chapter unaccounted for?
    last_sp = markers[-1]["start_page"]
    if last_sp < total_pages:
        found_back_markers = []
        last_bm_kw = None
        for p in range(last_sp + 1, total_pages + 1):
            txt = page_texts[p - 1] if p - 1 < len(page_texts) else ""
            lines = [clean_markdown_decorations(l.strip()) for l in txt.split('\n') if l.strip()]
            for l_idx, line in enumerate(lines[:8]):
                if is_footer_or_watermark(line):
                    continue
                m_bm = BACK_MATTER_HEADING_REGEX.match(line)
                if len(line) <= 90 and m_bm and not line.endswith('.'):
                    matched_kw = m_bm.group(1).strip().lower()
                    if matched_kw == last_bm_kw:
                        break
                    last_bm_kw = matched_kw

                    raw_title = line
                    if len(line.split()) <= 2 and l_idx + 1 < len(lines):
                        nxt = lines[l_idx + 1]
                        if len(nxt) <= 80 and not nxt.endswith('.') and not BACK_MATTER_HEADING_REGEX.match(nxt):
                            raw_title = f"{line.title()}: {nxt}"
                    else:
                        raw_title = raw_title.title()

                    if p not in seen_pages:
                        seen_pages.add(p)
                        found_back_markers.append({
                            "start_page": p,
                            "title": raw_title,
                            "chapter_number": len(markers) + len(found_back_markers) + 1,
                            "is_explicit": True,
                            "section_type": "back_matter"
                        })
                    break

        if found_back_markers:
            markers.extend(found_back_markers)

    markers.sort(key=lambda m: m["start_page"])
    for idx, m in enumerate(markers):
        if "section_type" not in m:
            m["section_type"] = classify_section_title(m["title"])

    return markers

# ---------------------------------------------------------------------------
# Summary & Topic Extraction
# ---------------------------------------------------------------------------

def generate_summary(text: str, max_sentences: int = 3, is_scanned: bool = False) -> str:
    """Extracts a readable 2-4 sentence summary from extracted chapter text."""
    if is_scanned or not text or len(text.strip().split()) < 5:
        return "Scanned or image-only page content. Text is rasterized without an embedded digital font layer."

    sentences = re.split(r'(?<=[.!?])\s+', text)
    valid_sentences = []
    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) > 25 and not s_clean.isupper() and not re.match(r'^\d+$', s_clean):
            valid_sentences.append(s_clean)
        if len(valid_sentences) >= max_sentences:
            break

    if valid_sentences:
        summary = " ".join(valid_sentences)
        return summary[:450] + ("..." if len(summary) > 450 else "")

    return text[:250].strip() + ("..." if len(text) > 250 else "")

def extract_key_topics(text: str, chapter_title: str, is_scanned: bool = False) -> list:
    """Extracts informative key topics / phrases from chapter text."""
    if is_scanned or not text or len(text.strip().split()) < 5:
        return [chapter_title]

    topics = []
    clean_title = re.sub(r'^' + CHAPTER_PREFIX_PATTERN + r'\s*\w*[\s:.-]*', '', chapter_title, flags=re.I).strip()
    if clean_title and clean_title.lower() not in [t.lower() for t in topics]:
        topics.append(clean_title)

    cap_phrases = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b', text[:3000])
    stop_words = {"The", "This", "That", "These", "Those", "There", "Here", "Chapter", "Section"}
    for cp in cap_phrases:
        first_word = cp.split()[0]
        if first_word not in stop_words and 5 < len(cp) < 40:
            if cp not in topics and len(topics) < 5:
                topics.append(cp)

    if len(topics) < 3:
        words = re.findall(r'\b[a-zA-Z]{5,}\b', text.lower())
        word_freq = {}
        common_stops = {
            "about", "above", "across", "after", "again", "against", "all", "almost", "along",
            "already", "also", "although", "always", "among", "another", "because", "become",
            "before", "between", "both", "could", "every", "first", "found", "great", "group",
            "however", "include", "large", "might", "number", "other", "part", "people", "point",
            "present", "right", "same", "several", "should", "since", "small", "state", "still",
            "system", "their", "there", "these", "thing", "think", "those", "through", "under",
            "using", "water", "where", "which", "while", "would"
        }
        for w in words:
            if w not in common_stops:
                word_freq[w] = word_freq.get(w, 0) + 1
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        for w, _ in sorted_words:
            cap_w = w.capitalize()
            if cap_w not in topics and len(topics) < 4:
                topics.append(cap_w)

    return topics if topics else [chapter_title]

def slice_subpage_text(sp: int, ep: int, marker: dict, next_marker: dict, page_texts: list) -> str:
    """
    Extracts chapter text, gracefully handling multiple sub-page headings on the same page,
    cross-page continuations, and automated removal of watermarks/footers.
    """
    if not page_texts or sp < 1 or sp > len(page_texts):
        return ""

    curr_pg_txt = page_texts[sp - 1]
    raw_target = marker.get("raw_heading") or marker.get("title") or ""
    clean_target = clean_markdown_decorations(raw_target).strip().lower()

    # Find where current marker starts on page sp
    pos1 = -1
    if clean_target:
        pos1 = curr_pg_txt.lower().find(clean_target[:20])
        if pos1 < 0:
            sub_t = re.sub(r'^(?:chapter|part|section)\s+\w+[\s:.-]*|^\d+[\s:.-]*', '', clean_target).strip()
            if sub_t:
                pos1 = curr_pg_txt.lower().find(sub_t[:20])

    if pos1 < 0:
        pos1 = 0

    # Determine slice within page sp
    if next_marker and next_marker.get("start_page") == sp:
        nxt_target = clean_markdown_decorations(
            next_marker.get("raw_heading") or next_marker.get("title") or ""
        ).strip().lower()
        pos2 = -1
        if nxt_target:
            pos2 = curr_pg_txt.lower().find(nxt_target[:20], pos1 + 5)
            if pos2 < 0:
                nxt_sub = re.sub(r'^(?:chapter|part|section)\s+\w+[\s:.-]*|^\d+[\s:.-]*', '', nxt_target).strip()
                if nxt_sub:
                    pos2 = curr_pg_txt.lower().find(nxt_sub[:20], pos1 + 5)
        if pos2 > pos1:
            section_txt = curr_pg_txt[pos1:pos2]
        else:
            section_txt = curr_pg_txt[pos1:]
    else:
        # Current marker extends to end of page sp
        section_txt = curr_pg_txt[pos1:] if pos1 > 0 else curr_pg_txt

        # Append subsequent pages up to ep
        if ep > sp:
            for p in range(sp + 1, min(ep + 1, len(page_texts) + 1)):
                section_txt += "\n" + page_texts[p - 1]

    # Clean out watermarks and separators from final extracted text
    cleaned_lines = []
    for l in section_txt.split("\n"):
        cl = clean_markdown_decorations(l)
        if not cl or cl == "---" or is_footer_or_watermark(cl):
            continue
        cleaned_lines.append(l)

    return clean_text("\n".join(cleaned_lines))

# ---------------------------------------------------------------------------
# Primary Engine: PyMuPDF (fitz)
# ---------------------------------------------------------------------------

def parse_with_pymupdf(pdf_path: str, fallback_file_name: str = ""):
    """Primary extraction engine using PyMuPDF (fitz)."""
    import fitz

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    if total_pages == 0:
        raise ValueError("PDF document is empty (0 pages).")

    page_texts = [clean_text(doc[p].get_text("text")) for p in range(total_pages)]

    total_doc_words = sum(len(t.split()) for t in page_texts)
    has_images = False
    try:
        has_images = any(len(doc[p].get_images()) > 0 for p in range(min(total_pages, 20)))
    except Exception:
        pass
    is_scanned_pdf = (total_doc_words < 25) and (has_images or total_pages > 0)

    # 1. Document title extraction
    meta_title = doc.metadata.get("title", "").strip() if doc.metadata else ""
    if is_dummy_title(meta_title):
        meta_title = ""

    # Inspect Page 1 for largest font spans if metadata is missing or dummy
    if not meta_title and total_pages > 0:
        try:
            p0 = doc[0]
            p0_dict = p0.get_text("dict")
            largest_sz = 0.0
            best_block_spans = []
            for b in p0_dict.get("blocks", []):
                if b.get("type") != 0:
                    continue
                block_spans = []
                block_max_sz = 0.0
                for l in b.get("lines", []):
                    for s in l.get("spans", []):
                        t = clean_markdown_decorations(s.get("text", "")).strip()
                        sz = round(float(s.get("size", 0)), 1)
                        if not t or is_footer_or_watermark(t) or is_dummy_title(t):
                            continue
                        if CHAPTER_PREFIX_REGEX.match(t) or NUM_PREFIX_REGEX.match(t):
                            continue
                        if sz > block_max_sz and len(t) >= 3:
                            block_max_sz = sz
                            block_spans = [t]
                        elif abs(sz - block_max_sz) < 0.8 and len(t) >= 2 and block_spans:
                            block_spans.append(t)
                if block_max_sz > largest_sz and block_spans:
                    largest_sz = block_max_sz
                    best_block_spans = block_spans
            if best_block_spans:
                meta_title = clean_markdown_decorations(" ".join(best_block_spans))
        except Exception:
            pass

    if not meta_title and page_texts:
        for line in page_texts[0].split('\n')[:4]:
            cl = clean_markdown_decorations(line)
            if cl and len(cl) >= 4 and not is_footer_or_watermark(cl) and not CHAPTER_PREFIX_REGEX.match(cl) and not NUM_PREFIX_REGEX.match(cl):
                meta_title = cl
                break

    if not meta_title and fallback_file_name:
        meta_title = re.sub(r'\.[a-zA-Z0-9]+$', '', fallback_file_name).replace('_', ' ').replace('-', ' ').title()

    doc_title = clean_markdown_decorations(meta_title) or "Untitled Document"

    # 2. Extract Document Outline (TOC bookmarks)
    toc = doc.get_toc()
    raw_markers = select_optimal_toc_markers(toc, total_pages)
    has_explicit = len(raw_markers) > 0

    # 3. High-precision Heading & Printed TOC Detection
    if not raw_markers:
        in_toc = False
        last_ch_num = 0

        # Check if doc uses explicit Chapter/Part keywords
        has_ch_kw = False
        for pt in page_texts:
            for l in pt.split('\n'):
                cl = clean_markdown_decorations(l)
                if CHAPTER_PREFIX_REGEX.match(cl):
                    has_ch_kw = True
                    break
            if has_ch_kw:
                break

        # Check if page 1 contains a real Chapter 1 or Section 1 (e.g. cheatsheet or single-page doc)
        p1_has_ch = bool(
            re.search(
                r'(?:^|\n)\s*(?:\*\*)?(?:chapter\s+1\b|[1]\s*[\.:–-]\s*[A-Z][A-Za-z]{2,})',
                page_texts[0],
                re.I,
            )
        )

        for pg_idx in range(total_pages):
            page = doc[pg_idx]
            raw_text = page_texts[pg_idx]
            raw_lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
            if not raw_lines:
                continue

            # Cover page check on multi-page documents: Page 1 is Cover unless it contains a real chapter
            if pg_idx == 0 and total_pages > 1 and not p1_has_ch:
                raw_markers.append({
                    "start_page": 1,
                    "title": "Cover & Overview",
                    "chapter_number": 1,
                    "is_explicit": False,
                    "section_type": "front_matter",
                    "raw_heading": "Cover & Overview"
                })
                continue

            # Check if this page introduces the printed Table of Contents
            has_toc_title = any(TOC_TITLE_REGEX.search(l) for l in raw_lines[:6])
            if has_toc_title:
                in_toc = True
                raw_markers.append({
                    "start_page": pg_idx + 1,
                    "title": "Table of Contents",
                    "chapter_number": len(raw_markers) + 1,
                    "is_explicit": True,
                    "section_type": "front_matter",
                    "raw_heading": "Table of Contents"
                })
                continue

            # Suppress false chapter matches while inside the printed Table of Contents
            if in_toc:
                ch_count = sum(
                    1 for l in raw_lines
                    if CHAPTER_PREFIX_REGEX.match(clean_markdown_decorations(l))
                    or re.search(r'\.{4,}\s*\d+', l)
                    or clean_markdown_decorations(l).lower().startswith('appendix')
                )
                if ch_count >= 2 or len(raw_lines) <= 4:
                    continue
                else:
                    in_toc = False

            # Filter running headers, page numbers, watermarks
            content_lines = []
            for l in raw_lines:
                cl = clean_markdown_decorations(l)
                if not cl or is_footer_or_watermark(cl):
                    continue
                if re.search(r'\|\s*Page\s+\d+', cl, re.I) or re.match(r'^\d+$', cl):
                    continue
                content_lines.append(l)

            if not content_lines:
                continue

            # Inspect lines on page
            for l_idx, line in enumerate(content_lines):
                cl = clean_markdown_decorations(line)
                if not cl or is_footer_or_watermark(cl) or cl == "---":
                    continue
                # Disqualify code blocks
                if cl.startswith('"""') or cl.startswith("'''") or cl.startswith('def ') or cl.startswith('async '):
                    break

                # 1. Front Matter Heading (in first 6 lines of page)
                if l_idx <= 5:
                    m_fm = FRONT_MATTER_HEADING_REGEX.match(cl)
                    if m_fm and not cl.endswith('.'):
                        ch_num, formatted = extract_chapter_number_and_name(cl, len(raw_markers) + 1)
                        raw_markers.append({
                            "start_page": pg_idx + 1,
                            "title": formatted,
                            "chapter_number": ch_num,
                            "is_explicit": True,
                            "section_type": "front_matter",
                            "raw_heading": line
                        })
                        break

                # 2. Back Matter Heading
                m_bm = BACK_MATTER_HEADING_REGEX.match(cl)
                if m_bm and not cl.endswith('.') and len(cl) <= 80:
                    ch_num, formatted = extract_chapter_number_and_name(cl, len(raw_markers) + 1)
                    raw_markers.append({
                        "start_page": pg_idx + 1,
                        "title": formatted,
                        "chapter_number": ch_num,
                        "is_explicit": True,
                        "section_type": "back_matter",
                        "raw_heading": line
                    })
                    if l_idx <= 3:
                        break
                    continue

                # 3. Explicit Chapter / Part Keyword Heading
                m_ch = CHAPTER_PREFIX_REGEX.match(cl)
                if m_ch and (l_idx <= 4 or "chapter" in cl.lower() or "part" in cl.lower() or "brief" in cl.lower()):
                    raw_kw = m_ch.group(1).lower().rstrip('.')
                    sec_type = "back_matter" if raw_kw in ("appendix", "app", "annex") else "chapter"
                    full_title = cl
                    if len(cl.split()) <= 2 and l_idx + 1 < len(content_lines):
                        nxt = clean_markdown_decorations(content_lines[l_idx + 1])
                        if not CHAPTER_PREFIX_REGEX.match(nxt) and not is_footer_or_watermark(nxt) and len(nxt) < 100:
                            full_title = f"{cl}: {nxt}"
                    ch_num, formatted = extract_chapter_number_and_name(full_title, len(raw_markers) + 1)

                    is_part = "part" in cl.lower() or "volume" in cl.lower()
                    if is_part or ch_num > last_ch_num or last_ch_num == 0:
                        if not is_part and isinstance(ch_num, int) and ch_num > 0:
                            last_ch_num = ch_num
                        raw_markers.append({
                            "start_page": pg_idx + 1,
                            "title": formatted,
                            "chapter_number": ch_num,
                            "is_explicit": True,
                            "section_type": sec_type,
                            "raw_heading": line
                        })
                        if not is_part and l_idx <= 3:
                            break
                    continue

                # 4. Numbered Heading when document does not use explicit Chapter keywords
                if not has_ch_kw:
                    m_num = NUM_PREFIX_REGEX.match(cl)
                    if m_num and not cl.endswith('.') and len(cl) <= 90:
                        num = int(m_num.group(1))
                        clean_t = m_num.group(2).strip()
                        raw_markers.append({
                            "start_page": pg_idx + 1,
                            "title": f"{num}. {clean_t}",
                            "chapter_number": num,
                            "is_explicit": True,
                            "section_type": "chapter",
                            "raw_heading": line
                        })
                        continue

        # If only synthetic "Cover & Overview" was found and no other chapters, clear it to trigger fallbacks!
        real_markers = [m for m in raw_markers if m["title"] != "Cover & Overview"]
        if not real_markers:
            raw_markers = []
        else:
            has_explicit = True

    # 3.5. Visual Layout & Typography Heading Fallback
    if not raw_markers:
        raw_markers = detect_visual_headings_pymupdf(doc, total_pages, doc_title)
        has_explicit = len(raw_markers) > 0

    # 4. Fallback: Semantic Lexical Partitioning
    if not raw_markers:
        has_explicit = False
        raw_markers = partition_unstructured_pages(page_texts, total_pages, doc_title)

    # Deduplicate identical titles on the same page
    unique_markers = []
    seen_markers = set()
    for m in sorted(raw_markers, key=lambda x: x["start_page"]):
        key = (m["start_page"], m["title"].lower())
        if key not in seen_markers:
            seen_markers.add(key)
            unique_markers.append(m)

    unique_markers = ensure_front_and_back_matter(unique_markers, page_texts, total_pages)

    # 5. Build contiguous chapter objects and extract text
    chapters = []
    n_markers = len(unique_markers)

    for idx, marker in enumerate(unique_markers):
        sp = marker["start_page"]
        next_m = unique_markers[idx + 1] if idx + 1 < n_markers else None

        if next_m:
            ep = max(sp, next_m["start_page"] - 1) if next_m["start_page"] > sp else sp
        else:
            ep = total_pages

        full_text = slice_subpage_text(sp, ep, marker, next_m, page_texts)
        word_count = len(full_text.split())
        summary = generate_summary(full_text, is_scanned=is_scanned_pdf)
        key_topics = extract_key_topics(full_text, marker["title"], is_scanned=is_scanned_pdf)

        ch_num = marker.get("chapter_number")
        if ch_num is None or not isinstance(ch_num, int):
            ch_num = idx + 1

        chapters.append({
            "chapter_number": ch_num,
            "title": marker["title"],
            "chapter_title": marker["title"],
            "start_page": sp,
            "end_page": ep,
            "content": full_text or f"Scanned image content across pages {sp} to {ep}.",
            "extracted_text": full_text,
            "summary": summary,
            "key_topics": key_topics,
            "word_count": word_count,
            "is_explicit_chapter": marker.get("is_explicit", True),
            "section_type": marker.get("section_type", "chapter"),
            "is_scanned": is_scanned_pdf
        })

    doc.close()
    return {
        "document_title": doc_title,
        "total_pages": total_pages,
        "total_chapters": len(chapters),
        "has_explicit_structure": has_explicit,
        "is_scanned_pdf": is_scanned_pdf,
        "ocr_recommended": is_scanned_pdf,
        "total_words": total_doc_words,
        "chapters": chapters
    }

# ---------------------------------------------------------------------------
# Fallback Engine: pypdf
# ---------------------------------------------------------------------------

def parse_with_pypdf(pdf_path: str, fallback_file_name: str = ""):
    """Secondary fallback extraction engine using pypdf."""
    import pypdf

    reader = pypdf.PdfReader(pdf_path)
    total_pages = len(reader.pages)
    if total_pages == 0:
        raise ValueError("PDF document is empty (0 pages).")

    meta = reader.metadata
    meta_title = ""
    if meta:
        try:
            meta_title = (meta.title or "").strip()
        except Exception:
            meta_title = ""
    if is_dummy_title(meta_title):
        meta_title = ""

    page_texts = [clean_text(reader.pages[p].extract_text() or "") for p in range(total_pages)]
    total_doc_words = sum(len(t.split()) for t in page_texts)
    has_images = False
    try:
        has_images = any(len(getattr(reader.pages[p], "images", [])) > 0 for p in range(min(total_pages, 20)))
    except Exception:
        pass
    is_scanned_pdf = (total_doc_words < 25) and (has_images or total_pages > 0)

    if not meta_title and page_texts:
        for line in page_texts[0].split('\n')[:8]:
            l_str = clean_markdown_decorations(line.strip())
            if len(l_str) >= 3 and not re.match(r'^\d+$', l_str) and not is_footer_or_watermark(l_str):
                meta_title = l_str
                break

    if not meta_title and fallback_file_name:
        meta_title = re.sub(r'\.[a-zA-Z0-9]+$', '', fallback_file_name).replace('_', ' ').replace('-', ' ').title()

    doc_title = meta_title or "Untitled Document"

    # 1. Outline extraction
    def extract_pypdf_outline(r):
        toc_items = []
        def _walk(outlines, lvl):
            if not outlines:
                return
            for item in outlines:
                if isinstance(item, list):
                    _walk(item, lvl + 1)
                else:
                    try:
                        title_val = getattr(item, "title", None) or str(item)
                        if hasattr(r, "get_destination_page_number"):
                            p_idx = r.get_destination_page_number(item)
                        else:
                            p_idx = -1
                        if p_idx >= 0:
                            toc_items.append([lvl, str(title_val).strip(), p_idx + 1])
                    except Exception:
                        pass
        try:
            if hasattr(r, "outline") and r.outline:
                _walk(r.outline, 1)
        except Exception:
            pass
        return toc_items

    pypdf_toc = extract_pypdf_outline(reader)
    raw_markers = select_optimal_toc_markers(pypdf_toc, total_pages) if pypdf_toc else []
    has_explicit = len(raw_markers) > 0

    # 2. Page scan with TOC suppression
    if not raw_markers:
        in_toc = False
        last_ch_num = 0

        has_ch_kw = False
        for pt in page_texts:
            for l in pt.split('\n'):
                cl = clean_markdown_decorations(l)
                if CHAPTER_PREFIX_REGEX.match(cl):
                    has_ch_kw = True
                    break
            if has_ch_kw:
                break

        # Check if page 1 contains a real Chapter 1 or Section 1 (e.g. cheatsheet or single-page doc)
        p1_has_ch = bool(
            re.search(
                r'(?:^|\n)\s*(?:\*\*)?(?:chapter\s+1\b|[1]\s*[\.:–-]\s*[A-Z][A-Za-z]{2,})',
                page_texts[0],
                re.I,
            )
        )

        for pg_idx in range(total_pages):
            raw_text = page_texts[pg_idx]
            raw_lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
            if not raw_lines:
                continue

            if pg_idx == 0 and total_pages > 1 and not p1_has_ch:
                raw_markers.append({
                    "start_page": 1,
                    "title": "Cover & Overview",
                    "chapter_number": 1,
                    "is_explicit": False,
                    "section_type": "front_matter",
                    "raw_heading": "Cover & Overview"
                })
                continue

            has_toc_title = any(TOC_TITLE_REGEX.search(l) for l in raw_lines[:6])
            if has_toc_title:
                in_toc = True
                raw_markers.append({
                    "start_page": pg_idx + 1,
                    "title": "Table of Contents",
                    "chapter_number": len(raw_markers) + 1,
                    "is_explicit": True,
                    "section_type": "front_matter",
                    "raw_heading": "Table of Contents"
                })
                continue

            if in_toc:
                ch_count = sum(
                    1 for l in raw_lines
                    if CHAPTER_PREFIX_REGEX.match(clean_markdown_decorations(l))
                    or re.search(r'\.{4,}\s*\d+', l)
                    or clean_markdown_decorations(l).lower().startswith('appendix')
                )
                if ch_count >= 2 or len(raw_lines) <= 4:
                    continue
                else:
                    in_toc = False

            content_lines = []
            for l in raw_lines:
                cl = clean_markdown_decorations(l)
                if not cl or is_footer_or_watermark(cl):
                    continue
                if re.search(r'\|\s*Page\s+\d+', cl, re.I) or re.match(r'^\d+$', cl):
                    continue
                content_lines.append(l)

            if not content_lines:
                continue

            for l_idx, line in enumerate(content_lines):
                cl = clean_markdown_decorations(line)
                if not cl or is_footer_or_watermark(cl) or cl == "---":
                    continue
                if cl.startswith('"""') or cl.startswith("'''") or cl.startswith('def ') or cl.startswith('async '):
                    break

                if l_idx <= 5:
                    m_fm = FRONT_MATTER_HEADING_REGEX.match(cl)
                    if m_fm and not cl.endswith('.'):
                        ch_num, formatted = extract_chapter_number_and_name(cl, len(raw_markers) + 1)
                        raw_markers.append({
                            "start_page": pg_idx + 1,
                            "title": formatted,
                            "chapter_number": ch_num,
                            "is_explicit": True,
                            "section_type": "front_matter",
                            "raw_heading": line
                        })
                        break

                m_bm = BACK_MATTER_HEADING_REGEX.match(cl)
                if m_bm and not cl.endswith('.') and len(cl) <= 80:
                    ch_num, formatted = extract_chapter_number_and_name(cl, len(raw_markers) + 1)
                    raw_markers.append({
                        "start_page": pg_idx + 1,
                        "title": formatted,
                        "chapter_number": ch_num,
                        "is_explicit": True,
                        "section_type": "back_matter",
                        "raw_heading": line
                    })
                    if l_idx <= 3:
                        break
                    continue

                m_ch = CHAPTER_PREFIX_REGEX.match(cl)
                if m_ch and (l_idx <= 4 or "chapter" in cl.lower() or "part" in cl.lower() or "brief" in cl.lower()):
                    raw_kw = m_ch.group(1).lower().rstrip('.')
                    sec_type = "back_matter" if raw_kw in ("appendix", "app", "annex") else "chapter"
                    full_title = cl
                    if len(cl.split()) <= 2 and l_idx + 1 < len(content_lines):
                        nxt = clean_markdown_decorations(content_lines[l_idx + 1])
                        if not CHAPTER_PREFIX_REGEX.match(nxt) and not is_footer_or_watermark(nxt) and len(nxt) < 100:
                            full_title = f"{cl}: {nxt}"
                    ch_num, formatted = extract_chapter_number_and_name(full_title, len(raw_markers) + 1)

                    is_part = "part" in cl.lower() or "volume" in cl.lower()
                    if is_part or ch_num > last_ch_num or last_ch_num == 0:
                        if not is_part and isinstance(ch_num, int) and ch_num > 0:
                            last_ch_num = ch_num
                        raw_markers.append({
                            "start_page": pg_idx + 1,
                            "title": formatted,
                            "chapter_number": ch_num,
                            "is_explicit": True,
                            "section_type": sec_type,
                            "raw_heading": line
                        })
                        if not is_part and l_idx <= 3:
                            break
                    continue

                if not has_ch_kw:
                    m_num = NUM_PREFIX_REGEX.match(cl)
                    if m_num and not cl.endswith('.') and len(cl) <= 90:
                        num = int(m_num.group(1))
                        clean_t = m_num.group(2).strip()
                        raw_markers.append({
                            "start_page": pg_idx + 1,
                            "title": f"{num}. {clean_t}",
                            "chapter_number": num,
                            "is_explicit": True,
                            "section_type": "chapter",
                            "raw_heading": line
                        })
                        continue

        real_markers = [m for m in raw_markers if m["title"] != "Cover & Overview"]
        if not real_markers:
            raw_markers = []
        else:
            has_explicit = True

    # 3. Fallback to semantic partition
    if not raw_markers:
        has_explicit = False
        raw_markers = partition_unstructured_pages(page_texts, total_pages, doc_title)

    unique_markers = []
    seen = set()
    for m in sorted(raw_markers, key=lambda x: x["start_page"]):
        key = (m["start_page"], m["title"].lower())
        if key not in seen:
            seen.add(key)
            unique_markers.append(m)

    unique_markers = ensure_front_and_back_matter(unique_markers, page_texts, total_pages)

    chapters = []
    n_markers = len(unique_markers)

    for idx, marker in enumerate(unique_markers):
        sp = marker["start_page"]
        next_m = unique_markers[idx + 1] if idx + 1 < n_markers else None
        if next_m:
            ep = max(sp, next_m["start_page"] - 1) if next_m["start_page"] > sp else sp
        else:
            ep = total_pages

        full_text = slice_subpage_text(sp, ep, marker, next_m, page_texts)
        word_count = len(full_text.split())
        summary = generate_summary(full_text, is_scanned=is_scanned_pdf)
        key_topics = extract_key_topics(full_text, marker["title"], is_scanned=is_scanned_pdf)

        ch_num = marker.get("chapter_number")
        if ch_num is None or not isinstance(ch_num, int):
            ch_num = idx + 1

        chapters.append({
            "chapter_number": ch_num,
            "title": marker["title"],
            "chapter_title": marker["title"],
            "start_page": sp,
            "end_page": ep,
            "content": full_text or f"Scanned image content across pages {sp} to {ep}.",
            "extracted_text": full_text,
            "summary": summary,
            "key_topics": key_topics,
            "word_count": word_count,
            "is_explicit_chapter": marker.get("is_explicit", True),
            "section_type": marker.get("section_type", "chapter"),
            "is_scanned": is_scanned_pdf
        })

    return {
        "document_title": doc_title,
        "total_pages": total_pages,
        "total_chapters": len(chapters),
        "has_explicit_structure": has_explicit,
        "is_scanned_pdf": is_scanned_pdf,
        "ocr_recommended": is_scanned_pdf,
        "total_words": total_doc_words,
        "chapters": chapters
    }

# ---------------------------------------------------------------------------
# Zero-Dependency Raw Byte Fallback
# ---------------------------------------------------------------------------

def parse_with_raw_bytes(pdf_path: str, fallback_file_name: str = ""):
    """Zero-dependency pure Python fallback using raw byte regex analysis."""
    try:
        with open(pdf_path, "rb") as f:
            data = f.read(5 * 1024 * 1024)
    except Exception as e:
        raise ValueError(f"Could not read PDF file bytes: {e}")

    total_pages = 1
    count_matches = re.findall(rb'/Count\s+(\d+)', data)
    if count_matches:
        for cm in count_matches:
            val = int(cm)
            if val > total_pages:
                total_pages = val

    if total_pages == 1:
        page_objs = len(re.findall(rb'/Type\s*/Page\b', data))
        if page_objs > 1:
            total_pages = page_objs

    doc_title = ""
    title_match = re.search(rb'/Title\s*\(([^)]+)\)', data)
    if title_match:
        try:
            doc_title = title_match.group(1).decode("latin-1", errors="ignore").strip()
        except Exception:
            pass

    if is_dummy_title(doc_title):
        doc_title = ""

    if not doc_title and fallback_file_name:
        doc_title = re.sub(r'\.[a-zA-Z0-9]+$', '', fallback_file_name).replace('_', ' ').replace('-', ' ').title()
    if not doc_title:
        doc_title = "Untitled Document"

    num_sections = (
        1 if total_pages <= 1
        else (total_pages if total_pages <= 4
        else min(8, max(3, round(total_pages / 6))))
    )
    pages_per_sec = max(1, total_pages // num_sections)
    chapters = []

    for i in range(num_sections):
        sp = 1 if i == 0 else i * pages_per_sec + 1
        ep = total_pages if i == num_sections - 1 else min(total_pages, (i + 1) * pages_per_sec)
        ch_num = i + 1

        sec_type = "chapter"
        if num_sections > 2:
            if i == 0 and sp == 1:
                title = f"Part 1: Preliminary & Overview (Pages {sp}–{ep})"
                sec_type = "front_matter"
            elif i == num_sections - 1 and ep == total_pages:
                title = f"Part {ch_num}: Concluding Synthesis (Pages {sp}–{ep})"
                sec_type = "back_matter"
            else:
                title = f"Part {ch_num}: Core Topic Progression (Pages {sp}–{ep})"
        elif num_sections == 1:
            title = f"{doc_title} (Complete Document, Pages 1–{total_pages})"
        else:
            title = f"Section {ch_num}: Pages {sp}–{ep}"

        chapters.append({
            "chapter_number": ch_num,
            "title": title,
            "chapter_title": title,
            "start_page": sp,
            "end_page": ep,
            "content": f"Logical section {ch_num} of {doc_title}, spanning pages {sp} to {ep}.",
            "extracted_text": f"Logical section {ch_num} of {doc_title}, spanning pages {sp} to {ep}.",
            "summary": f"Logical section {ch_num} covering document progression from page {sp} through page {ep}.",
            "key_topics": [doc_title, f"Pages {sp}–{ep}"],
            "word_count": 0,
            "is_explicit_chapter": False,
            "section_type": sec_type,
            "is_scanned": True
        })

    return {
        "document_title": doc_title,
        "total_pages": total_pages,
        "total_chapters": len(chapters),
        "has_explicit_structure": False,
        "is_scanned_pdf": True,
        "ocr_recommended": True,
        "total_words": 0,
        "chapters": chapters
    }

# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 pdf_chapter_extractor.py <pdf_path> [file_name]"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    fallback_name = sys.argv[2] if len(sys.argv) > 2 else ""

    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"PDF file not found at: {pdf_path}"}))
        sys.exit(1)

    last_err = None

    # 1. Try PyMuPDF (fitz)
    try:
        result = parse_with_pymupdf(pdf_path, fallback_name)
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
    except ImportError:
        pass
    except Exception as e:
        last_err = e

    # 2. Try pypdf
    try:
        result = parse_with_pypdf(pdf_path, fallback_name)
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
    except ImportError:
        pass
    except Exception as e:
        last_err = e

    # 3. Raw byte fallback
    try:
        result = parse_with_raw_bytes(pdf_path, fallback_name)
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse PDF: {e if not last_err else str(last_err) + '; ' + str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
