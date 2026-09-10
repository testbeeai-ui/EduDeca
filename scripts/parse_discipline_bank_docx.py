"""Parse per-discipline EduDeca Level 1–3 Word banks (DIsiplines folder)."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from parse_l1_docx import extract_paragraphs
from parse_mock_docx import (
    DIFFICULTY_RATING,
    TYPE_HEADING_RE,
    _is_abbrev_initial,
    normalize_question_type,
)

BANK_DIR = Path(r"C:\Users\tempo\Downloads\DIsiplines")
LETTER = {"A": 0, "B": 1, "C": 2, "D": 3}
ANSWER_KEY_RE = re.compile(r"answer\s*key", re.I)
Q_HEAD_RE = re.compile(r"^Q(\d+)\.\s*(.*)$", re.S)
DIFFICULTY_LINE_RE = re.compile(
    r"^(Simple|Medium-Difficult|Medium-Tricky|Higher-Medium|Slightly Tricky|"
    r"Difficult|Tricky|Higher|Medium)\s*$",
    re.I,
)

# Longer needles first. "biology" is a prefix of "biotechnology".
DISC_NEEDLES: tuple[tuple[str, str], ...] = (
    ("applied mathematics", "amat"),
    ("biotechnology", "biotech"),
    ("quantitative ability", "eco"),
    ("quantitaive ability", "eco"),
    ("analytical ability", "log"),
    ("verbal ability", "eng"),
    ("financial literacy", "fin"),
    ("general knowledge", "gk"),
    ("entrepreneurship", "ent"),
    ("entrepreneur", "ent"),
    ("chemistry", "che"),
    ("physics", "phy"),
    ("mathematics", "mat"),
    ("biology", "bio"),
    ("maths", "mat"),
)

EXTRA_DIFFICULTY = {
    "medium-tricky": 4,
    "simple-plus": 3,
    "easy-plus": 3,
}

HEADER_TOKENS = {
    "q",
    "answer",
    "ans",
    "type",
    "difficulty",
}

CHAPTER_HEADING_RE = re.compile(r"^(CHAPTER|TOPIC)\s+\d+\s*[—–:-]\s+\S", re.I)
RANDOM_HEADING_RE = re.compile(r"^RANDOM MIXED\b", re.I)
NUMBERED_CHAPTER_RE = re.compile(r"^\d+\.\s+[A-Za-z].+")
CLASS_LEVEL = {11: "XI", 12: "XII"}


def type_heading_label(line: str) -> str | None:
    stripped = line.strip()
    if TYPE_HEADING_RE.match(stripped):
        return normalize_question_type(stripped)
    return None


def chapter_heading_label(line: str) -> str | None:
    stripped = line.strip()
    if TYPE_HEADING_RE.match(stripped) or Q_HEAD_RE.match(stripped):
        return None
    if (
        CHAPTER_HEADING_RE.match(stripped)
        or RANDOM_HEADING_RE.match(stripped)
        or NUMBERED_CHAPTER_RE.match(stripped)
    ):
        return normalize_question_type(stripped)
    return None


def is_section_heading(line: str) -> bool:
    return type_heading_label(line) is not None or chapter_heading_label(line) is not None


def classify_bank_filename(name: str) -> tuple[str, int, int | None]:
    lower = Path(name).name.lower()
    level_match = re.search(r"level\s*[-–—]?\s*(\d)", lower)
    if not level_match:
        raise ValueError(f"No level in filename: {name}")
    level = int(level_match.group(1))
    grade: int | None = None
    if re.search(r"class\s*(xii|12)\b", lower):
        grade = 12
    elif re.search(r"class\s*(xi|11)\b", lower):
        grade = 11
    disc: str | None = None
    for needle, disc_id in DISC_NEEDLES:
        if needle in lower:
            disc = disc_id
            break
    if disc is None:
        raise ValueError(f"No discipline in filename: {name}")
    return disc, level, grade


def _difficulty_rating(label: str | None) -> int | None:
    if not label:
        return None
    key = label.strip().lower()
    if key in EXTRA_DIFFICULTY:
        return EXTRA_DIFFICULTY[key]
    return DIFFICULTY_RATING.get(key)


def split_glued_options(blob: str) -> list[str]:
    text = blob.strip()
    paren = _split_marked_options(text, ")")
    if len(paren) == 4:
        return paren
    dotted = _split_marked_options(text, ".")
    if len(dotted) == 4:
        return dotted
    return []


def _split_marked_options(text: str, mark: str) -> list[str]:
    starts: list[int] = []
    search_at = 0
    letters = "ABCDE"
    for letter in letters:
        found: int | None = None
        pattern = rf"{letter}\{mark}" if mark == ")" else rf"{letter}\."
        for match in re.finditer(pattern, text[search_at:]):
            abs_start = search_at + match.start()
            if mark == "." and _is_abbrev_initial(text, abs_start, letter):
                continue
            found = abs_start
            break
        if found is None:
            break
        starts.append(found)
        search_at = found + 2
    if len(starts) != 4:
        return []
    # Five-choice data-sufficiency (A–E) is not a Daily Challenge MCQ.
    rest = text[starts[3] + 2 :]
    if re.search(r"E[.)]", rest):
        return []
    options: list[str] = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else len(text)
        option = re.sub(r"\s+", " ", text[start + 2 : end]).strip()
        options.append(option)
    if not all(options):
        return []
    return options


def _answer_key_indices(lines: list[str]) -> list[int]:
    return [i for i, line in enumerate(lines) if ANSWER_KEY_RE.search(line)]


def _key_tokens_after(lines: list[str], key_index: int) -> list[str]:
    tokens: list[str] = []
    for line in lines[key_index + 1 :]:
        if ANSWER_KEY_RE.search(line):
            break
        if Q_HEAD_RE.match(line.strip()):
            break
        if TYPE_HEADING_RE.match(line.strip()):
            break
        stripped = line.strip()
        if stripped:
            tokens.append(stripped)
    return tokens


def _parse_answer_key(tokens: list[str]) -> dict[int, tuple[int, int | None]]:
    """Map question number → (correct_index, optional difficulty_rating)."""
    answers: dict[int, tuple[int, int | None]] = {}
    i = 0
    while i < len(tokens):
        token = tokens[i].strip()
        if token.lower() in HEADER_TOKENS or token == "":
            i += 1
            continue
        if re.fullmatch(r"\d+", token) and i + 1 < len(tokens):
            letter = tokens[i + 1].strip().upper()
            if letter in LETTER:
                rating = None
                j = i + 2
                while j < len(tokens):
                    nxt = tokens[j].strip()
                    if re.fullmatch(r"\d+", nxt) and j + 1 < len(tokens) and tokens[j + 1].strip().upper() in LETTER:
                        break
                    if nxt.lower() in HEADER_TOKENS:
                        j += 1
                        continue
                    maybe = _difficulty_rating(nxt)
                    if maybe is not None:
                        rating = maybe
                    j += 1
                answers[int(token)] = (LETTER[letter], rating)
                i = i + 2
                continue
        i += 1
    return answers


def _parse_question_body(
    body: list[str],
    answers: dict[int, tuple[int, int | None]],
    disc: str,
    level: int,
    class_level: str | None,
) -> list[dict[str, Any]]:
    current_type: str | None = None
    current_chapter: str | None = None
    parsed: list[dict[str, Any]] = []
    i = 0
    while i < len(body):
        line = body[i].strip()
        typed = type_heading_label(line)
        if typed:
            current_type = typed
            i += 1
            continue
        chaptered = chapter_heading_label(line)
        if chaptered:
            current_chapter = chaptered
            i += 1
            continue
        head = Q_HEAD_RE.match(line)
        if not head:
            i += 1
            continue
        num = int(head.group(1))
        rest = head.group(2).strip()
        rating = None
        payload_parts: list[str] = []
        if rest:
            diff_only = DIFFICULTY_LINE_RE.match(rest)
            if diff_only:
                rating = _difficulty_rating(diff_only.group(1))
            else:
                payload_parts.append(rest)
        i += 1
        while i < len(body):
            nxt = body[i].strip()
            if Q_HEAD_RE.match(nxt) or is_section_heading(nxt):
                break
            payload_parts.append(body[i])
            i += 1
        payload = "\n".join(payload_parts).strip()
        opt_at = re.search(r"(?m)(^|\n)A[.)]", payload)
        if not opt_at:
            opt_at = re.search(r"A[.)]", payload)
        if not opt_at:
            continue
        start = opt_at.start()
        if payload[start] == "\n":
            start += 1
        stem = payload[:start].strip()
        options = split_glued_options(payload[start:])
        if len(options) != 4 or not stem:
            continue
        if num not in answers:
            continue
        correct, key_rating = answers[num]
        parsed.append(
            {
                "q_num": num,
                "discipline_id": disc,
                "level": level,
                "stem": stem,
                "options": options,
                "correct_index": correct,
                "explanation": None,
                "difficulty_rating": rating if rating is not None else key_rating,
                "type": current_type,
                "chapter": current_chapter,
                "class_level": class_level,
                "published": True,
            }
        )
    return parsed


def parse_discipline_bank_docx(docx_path: Path) -> list[dict[str, Any]]:
    path = Path(docx_path)
    disc, level, grade = classify_bank_filename(path.name)
    class_level = CLASS_LEVEL.get(grade) if grade else None
    if not path.is_file():
        raise FileNotFoundError(path)
    lines = extract_paragraphs(path)
    # Some banks (Verbal L3) append a second question block + answer key in the
    # same doc. Parse every key-bounded section so the pool reaches full size.
    key_indices = _answer_key_indices(lines)
    if not key_indices:
        raise ValueError(f"{path.name}: Missing answer key")
    parsed: list[dict[str, Any]] = []
    body_start = 0
    for key_at in key_indices:
        answers = _parse_answer_key(_key_tokens_after(lines, key_at))
        if not answers:
            body_start = key_at + 1
            continue
        section = _parse_question_body(lines[body_start:key_at], answers, disc, level, class_level)
        parsed.extend(section)
        body_start = key_at + 1
    if not parsed:
        raise ValueError(f"{path.name}: no questions parsed")
    return parsed


def collect_discipline_banks(folder: Path = BANK_DIR) -> list[dict[str, Any]]:
    files: list[tuple[int, int, str, Path]] = []
    for path in sorted(folder.glob("*.docx")):
        if not re.search(r"\blevel\s*[-–—]?\s*\d", path.name, re.I):
            continue
        disc, level, grade = classify_bank_filename(path.name)
        files.append((level, grade or 0, disc, path))
    files.sort(key=lambda item: (item[0], item[2], item[1], item[3].name.lower()))

    grouped: dict[tuple[int, str], list[dict[str, Any]]] = {}
    for level, _grade, disc, path in files:
        questions = parse_discipline_bank_docx(path)
        grouped.setdefault((level, disc), []).extend(questions)

    rows: list[dict[str, Any]] = []
    for (level, disc), questions in sorted(grouped.items()):
        for slot, q in enumerate(questions, start=1):
            rows.append(
                {
                    "id": f"l{level}-{disc}-{slot:02d}",
                    "discipline_id": disc,
                    "level": level,
                    "sort_order": slot,
                    "stem": q["stem"],
                    "options": q["options"],
                    "correct_index": int(q["correct_index"]),
                    "explanation": q.get("explanation"),
                    "difficulty_rating": q.get("difficulty_rating"),
                    "type": normalize_question_type(q.get("type")),
                    "chapter": normalize_question_type(q.get("chapter")),
                    "class_level": q.get("class_level"),
                    "published": True,
                }
            )
    return rows
