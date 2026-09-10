"""Parse EduDeca Level-1 DOCX: 20 sets × 12 subjects. Ignores the QC page."""

from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
M = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"

DOC_PATH = Path(
    r"C:\Users\tempo\Downloads\EduDeca Level-1 Question - 20 sets with 12 subects (1).docx"
)
OUT_JSON = Path(__file__).resolve().parents[1] / "_l1_seed.json"

DISC_MAP = {
    "Physics": "phy",
    "Chemistry": "che",
    "Mathematics": "mat",
    "Biology": "bio",
    "Applied Mathematics": "amat",
    "Biotechnology": "biotech",
    "Verbal Ability": "eng",
    "Analytical Ability": "log",
    "Financial Literacy": "fin",
    "General Knowledge": "gk",
    "Quantitative Ability": "eco",
    "Entrepreneurship": "ent",
}
BANK_SUBJECTS = tuple(DISC_MAP.values())
LETTER = {"A": 0, "B": 1, "C": 2, "D": 3}
QC_MARKER = "Quality-Control Framework"


def _local(tag: str) -> str:
    return tag.split("}")[-1]


def _omml_to_latex(el: ET.Element) -> str:
    tag = _local(el.tag)
    if tag == "t":
        return el.text or ""
    if tag == "f":
        num = den = ""
        for child in el:
            name = _local(child.tag)
            if name == "num":
                num = "".join(_omml_to_latex(x) for x in child)
            elif name == "den":
                den = "".join(_omml_to_latex(x) for x in child)
        return rf"\frac{{{num}}}{{{den}}}"
    if tag in ("sSup", "sSub", "sSubSup"):
        base = sup = sub = ""
        for child in el:
            name = _local(child.tag)
            body = "".join(_omml_to_latex(x) for x in child)
            if name == "e":
                base = body
            elif name == "sup":
                sup = body
            elif name == "sub":
                sub = body
        if tag == "sSup":
            return rf"{base}^{{{sup}}}"
        if tag == "sSub":
            return rf"{base}_{{{sub}}}"
        return rf"{base}_{{{sub}}}^{{{sup}}}"
    if tag == "d":
        inner = "".join(_omml_to_latex(c) for c in el)
        return f"({inner})"
    if tag == "rad":
        deg = ""
        radicand = ""
        for child in el:
            name = _local(child.tag)
            body = "".join(_omml_to_latex(x) for x in child)
            if name == "deg":
                deg = body.strip()
            elif name == "e":
                radicand = body
        if deg:
            return rf"\sqrt[{deg}]{{{radicand}}}"
        return rf"\sqrt{{{radicand}}}"
    if tag == "r":
        return "".join(_omml_to_latex(c) for c in el)
    return "".join(_omml_to_latex(c) for c in el)


def _para_text(para: ET.Element) -> str:
    parts: list[str] = []

    def walk(el: ET.Element) -> None:
        if el.tag in (f"{M}oMath", f"{M}oMathPara"):
            latex = _omml_to_latex(el).strip()
            if latex:
                parts.append(f"${latex}$")
            return
        if el.tag == f"{W}t":
            parts.append(el.text or "")
        for child in list(el):
            walk(child)

    walk(para)
    text = "".join(parts)
    text = re.sub(r"\$([^$]+)\$([A-Za-z])", r"$\1$ \2", text)
    return re.sub(r"\s+", " ", text).strip()


def extract_paragraphs(docx_path: Path) -> list[str]:
    with zipfile.ZipFile(docx_path) as zipped:
        xml = zipped.read("word/document.xml")
    root = ET.fromstring(xml)
    lines: list[str] = []
    for para in root.iter(f"{W}p"):
        line = _para_text(para)
        if line:
            lines.append(line)
    return lines


def _split_options(blob: str) -> list[str]:
    parts = re.split(r"(?=[A-D]\.)", blob.strip())
    opts: list[str] = []
    for part in parts:
        match = re.match(r"^[A-D]\.\s*(.*)$", part.strip(), re.S)
        if match:
            opts.append(re.sub(r"\s+", " ", match.group(1)).strip())
    return opts


def _assign_difficulty(set_number: int, count: int = 12) -> list[int]:
    ratings = [3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5]
    seed = (set_number * 1103515245 + 12345) & 0xFFFFFFFF
    for i in range(count - 1, 0, -1):
        seed = (seed * 1103515245 + 12345) & 0xFFFFFFFF
        j = seed % (i + 1)
        ratings[i], ratings[j] = ratings[j], ratings[i]
    return ratings


def _parse_answer_key(line: str) -> dict[int, int]:
    answers: dict[int, int] = {}
    for match in re.finditer(r"(\d+)\s*[-–—]\s*([A-D])", line):
        answers[int(match.group(1))] = LETTER[match.group(2)]
    return answers


def parse_level1_docx(docx_path: Path) -> list[dict[str, Any]]:
    if not docx_path.is_file():
        raise FileNotFoundError(docx_path)
    lines = extract_paragraphs(docx_path)
    joined = "\n".join(lines)
    joined = joined.split(QC_MARKER)[0]
    chunks = re.split(r"(?=SET\s+\d+\s+[—–-]\s*12 Questions)", joined)
    questions: list[dict[str, Any]] = []

    for chunk in chunks:
        header = re.search(r"SET\s+(\d+)\s+[—–-]\s*12 Questions", chunk)
        if not header:
            continue
        set_no = int(header.group(1))
        key_match = re.search(r"Answer Key\s+[—–-]\s*Set\s+\d+:(.+)", chunk)
        if not key_match:
            raise ValueError(f"Missing answer key for set {set_no}")
        answers = _parse_answer_key(key_match.group(1))
        body = chunk[: key_match.start()]
        q_blocks = re.split(r"(?=Q\d+\.\s)", body)
        parsed: list[dict[str, Any]] = []
        difficulties = _assign_difficulty(set_no)

        for block in q_blocks:
            qm = re.match(r"Q(\d+)\.\s+(.+)", block.strip(), re.S)
            if not qm:
                continue
            num = int(qm.group(1))
            rest = qm.group(2).strip()
            first_nl = rest.find("\n")
            if first_nl == -1:
                raise ValueError(f"Set {set_no} Q{num}: missing stem")
            subject = rest[:first_nl].strip()
            payload = rest[first_nl + 1 :].strip()
            if subject not in DISC_MAP:
                raise ValueError(f"Set {set_no} Q{num}: unknown subject {subject!r}")
            opt_at = re.search(r"(?m)(^|\n)A\.", payload)
            if not opt_at:
                opt_at = re.search(r"A\.", payload)
            if not opt_at:
                raise ValueError(f"Set {set_no} Q{num}: no options")
            start = opt_at.start()
            if payload[start] == "\n":
                start += 1
            stem = payload[:start].strip()
            options = _split_options(payload[start:])
            if len(options) != 4:
                raise ValueError(f"Set {set_no} Q{num}: {len(options)} options {options!r}")
            if num not in answers:
                raise ValueError(f"Set {set_no} Q{num}: missing key")
            subject_id = DISC_MAP[subject]
            parsed.append(
                {
                    "id": f"l1-s{set_no:02d}-{subject_id}",
                    "set_number": set_no,
                    "q_num": num,
                    "subject_id": subject_id,
                    "level": 1,
                    "sort_order": set_no,
                    "stem": stem,
                    "options": options,
                    "correct_index": answers[num],
                    "explanation": None,
                    "difficulty_rating": difficulties[num - 1],
                    "type": None,
                    "published": True,
                }
            )

        if len(parsed) != 12:
            raise ValueError(f"Set {set_no}: expected 12 questions, got {len(parsed)}")
        questions.extend(parsed)

    if len(questions) != 240:
        raise ValueError(f"Expected 240 questions, got {len(questions)}")
    return questions


def main() -> None:
    rows = parse_level1_docx(DOC_PATH)
    OUT_JSON.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_JSON} ({len(rows)} questions)")


if __name__ == "__main__":
    main()
