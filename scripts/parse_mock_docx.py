"""Parse EduDeca mock Word banks (L1 reuse, L2/L3 messy headers)."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from parse_l1_docx import (
    DISC_MAP,
    _parse_answer_key,
    extract_paragraphs,
)

# Second letters of common abbreviations (D.C., B.C.) must not split options.
_ABBREV_PAIRS = {("D", "C"), ("B", "C"), ("A", "D"), ("A", "M"), ("P", "M"), ("U", "S")}

L2_DOC_PATH = Path(
    r"C:\Users\tempo\Downloads\EduDeca Level-2 Questions - 20 sets with 24 Qs each.docx"
)
L3_DOC_PATH = Path(
    r"C:\Users\tempo\Downloads\EduDeca Level-3 Questions - 20 sets with 36 Qs each.docx"
)

SUBJECTS = tuple(DISC_MAP.keys())
SUBJECT_RE = "|".join(sorted((re.escape(name) for name in SUBJECTS), key=len, reverse=True))
DIFFICULTY_LABELS = (
    "Higher-Medium",
    "Slightly Tricky",
    "Medium-Difficult",
    "Difficult",
    "Tricky",
    "Higher",
    "Medium",
    "Simple",
)
DIFFICULTY_RE = "|".join(re.escape(label) for label in DIFFICULTY_LABELS)
DIFFICULTY_RATING = {
    "simple": 2,
    "medium": 3,
    "higher-medium": 4,
    "medium-difficult": 4,
    "higher": 4,
    "slightly tricky": 5,
    "difficult": 5,
    "tricky": 5,
}

SET_HEADER_RE = re.compile(
    r"^(?:LEVEL[- ]?3\s*[—–-]\s*)?SET\s+(\d+)(?:\s*[|—–-].*)?$",
    re.I,
)
ANSWER_KEY_RE = re.compile(r"answer\s*key", re.I)
TYPE_HEADING_RE = re.compile(r"^TYPE(?:\s+\d+)?\s*[—–:-]\s*(.+)$", re.I)
Q_HEAD_RE = re.compile(
    rf"Q(\d+)\.\s+({SUBJECT_RE})(?:\s*[—–-]\s*({DIFFICULTY_RE}))?\s*(.*)$",
    re.S | re.I,
)


def normalize_question_type(raw: object) -> str | None:
    if not isinstance(raw, str):
        return None
    label = raw.strip()
    return label if label else None


def _difficulty_rating(label: str | None) -> int | None:
    if not label:
        return None
    return DIFFICULTY_RATING.get(label.strip().lower())


def _is_set_header(line: str) -> int | None:
    stripped = line.strip()
    if ANSWER_KEY_RE.search(stripped):
        return None
    match = SET_HEADER_RE.match(stripped)
    if not match:
        return None
    return int(match.group(1))


def _strip_answer_key_header(line: str) -> str:
    return re.sub(
        r"(?i)^.*?answer\s*key\s*[—–:\-]*\s*(?:set\s+\d+\s*:?)?",
        "",
        line,
        count=1,
    ).strip()


def to_mock_rows(questions: list[dict[str, Any]], level: int) -> list[dict[str, Any]]:
    counters: dict[tuple[int, str], int] = {}
    rows: list[dict[str, Any]] = []
    for q in questions:
        set_no = int(q["set_number"])
        disc = str(q.get("discipline_id") or q["subject_id"])
        key = (set_no, disc)
        counters[key] = counters.get(key, 0) + 1
        sort_order = counters[key]
        rows.append(
            {
                "id": f"mock-l{level}-s{set_no:02d}-{disc}-{sort_order:02d}",
                "level": level,
                "set_number": set_no,
                "discipline_id": disc,
                "sort_order": sort_order,
                "stem": q["stem"],
                "options": q["options"],
                "correct_index": int(q["correct_index"]),
                "explanation": q.get("explanation"),
                "difficulty_rating": q.get("difficulty_rating"),
                "type": normalize_question_type(q.get("type")),
                "published": True,
            }
        )
    return rows


def _split_sets(lines: list[str]) -> list[list[str]]:
    sets: list[list[str]] = []
    current: list[str] | None = None
    for line in lines:
        if _is_set_header(line) is not None:
            if current is not None:
                sets.append(current)
            current = []
            continue
        if current is not None:
            current.append(line)
    if current is not None:
        sets.append(current)
    return sets


def _split_body_and_key(set_lines: list[str]) -> tuple[str, str]:
    body: list[str] = []
    key_parts: list[str] = []
    seen_key = False
    for line in set_lines:
        if not seen_key and ANSWER_KEY_RE.search(line):
            seen_key = True
            remainder = _strip_answer_key_header(line)
            if remainder:
                key_parts.append(remainder)
            continue
        if seen_key:
            if _is_set_header(line) is not None:
                break
            key_parts.append(line)
        else:
            body.append(line)
    if not seen_key:
        raise ValueError("Missing answer key")
    return "\n".join(body), "\n".join(key_parts)


def _is_abbrev_initial(text: str, letter_at: int, letter: str) -> bool:
    """True for the C in 'D.C.' — not the C in glued 'informed.C. Next'."""
    if letter_at < 2 or text[letter_at - 1] != ".":
        return False
    prev = text[letter_at - 2].upper()
    if (prev, letter) not in _ABBREV_PAIRS:
        return False
    if letter_at == 2:
        return True
    return not text[letter_at - 3].isalnum()


def _split_options(blob: str) -> list[str]:
    """Split A./B./C./D. options, including glued lines, without breaking D.C."""
    text = blob.strip()
    starts: list[int] = []
    search_at = 0
    for letter in "ABCD":
        found: int | None = None
        for match in re.finditer(rf"{letter}\.", text[search_at:]):
            abs_start = search_at + match.start()
            if _is_abbrev_initial(text, abs_start, letter):
                continue
            found = abs_start
            break
        if found is None:
            return []
        starts.append(found)
        search_at = found + 2
    options: list[str] = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else len(text)
        option = re.sub(r"\s+", " ", text[start + 2 : end]).strip()
        options.append(option)
    return options


def _parse_type_and_payload(payload: str) -> tuple[str | None, str]:
    lines = payload.split("\n")
    qtype: str | None = None
    start = 0
    if lines:
        typed = TYPE_HEADING_RE.match(lines[0].strip())
        if typed:
            qtype = normalize_question_type(typed.group(1))
            start = 1
    return qtype, "\n".join(lines[start:]).strip()


def _parse_questions(body: str, set_no: int, expected: int) -> list[dict[str, Any]]:
    blocks = re.split(r"(?=Q\d+\.\s)", body)
    parsed: list[dict[str, Any]] = []
    for block in blocks:
        chunk = block.strip()
        if not chunk:
            continue
        match = Q_HEAD_RE.match(chunk)
        if not match:
            continue
        num = int(match.group(1))
        subject = None
        for name in SUBJECTS:
            if name.lower() == match.group(2).strip().lower():
                subject = name
                break
        if subject is None or subject not in DISC_MAP:
            raise ValueError(f"Set {set_no} Q{num}: unknown subject {match.group(2)!r}")
        rating = _difficulty_rating(match.group(3))
        qtype, payload = _parse_type_and_payload(match.group(4).strip())
        opt_at = re.search(r"(?m)(^|\n)A\.", payload)
        if not opt_at:
            opt_at = re.search(r"A\.", payload)
        if not opt_at:
            raise ValueError(f"Set {set_no} Q{num}: no options")
        start = opt_at.start()
        if payload[start] == "\n":
            start += 1
        stem = payload[:start].strip()
        if not stem:
            raise ValueError(f"Set {set_no} Q{num}: missing stem")
        options = _split_options(payload[start:])
        if len(options) != 4:
            raise ValueError(f"Set {set_no} Q{num}: {len(options)} options {options!r}")
        parsed.append(
            {
                "q_num": num,
                "set_number": set_no,
                "subject_id": DISC_MAP[subject],
                "stem": stem,
                "options": options,
                "explanation": None,
                "difficulty_rating": rating,
                "type": qtype,
            }
        )
    if len(parsed) != expected:
        raise ValueError(f"Set {set_no}: expected {expected} questions, got {len(parsed)}")
    nums = [q["q_num"] for q in parsed]
    if sorted(nums) != list(range(1, expected + 1)):
        raise ValueError(f"Set {set_no}: question numbers {nums}")
    return parsed


def parse_mock_level_docx(
    docx_path: Path,
    level: int,
    questions_per_set: int,
) -> list[dict[str, Any]]:
    if not docx_path.is_file():
        raise FileNotFoundError(docx_path)
    lines = extract_paragraphs(docx_path)
    chunks = _split_sets(lines)
    if len(chunks) != 20:
        raise ValueError(f"Expected 20 sets, got {len(chunks)}")

    raw: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks, start=1):
        try:
            body, key_text = _split_body_and_key(chunk)
        except ValueError as exc:
            raise ValueError(f"Set {index}: {exc}") from exc
        answers = _parse_answer_key(key_text)
        if len(answers) != questions_per_set:
            raise ValueError(
                f"Set {index}: expected {questions_per_set} answers, got {len(answers)}"
            )
        questions = _parse_questions(body, index, questions_per_set)
        for q in questions:
            num = int(q["q_num"])
            if num not in answers:
                raise ValueError(f"Set {index} Q{num}: missing key")
            q["correct_index"] = answers[num]
        raw.extend(questions)

    expected_total = 20 * questions_per_set
    if len(raw) != expected_total:
        raise ValueError(f"Expected {expected_total} questions, got {len(raw)}")
    return to_mock_rows(raw, level)


def parse_level2_docx(docx_path: Path = L2_DOC_PATH) -> list[dict[str, Any]]:
    return parse_mock_level_docx(docx_path, level=2, questions_per_set=24)


def parse_level3_docx(docx_path: Path = L3_DOC_PATH) -> list[dict[str, Any]]:
    return parse_mock_level_docx(docx_path, level=3, questions_per_set=36)
