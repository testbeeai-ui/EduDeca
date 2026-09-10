"""Parse EduDeca Levels 1-3 questions from extracted docx text."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_PATH = ROOT / "_questions_extract.txt"
OUT_PATH = ROOT / "_questions_seed.json"

DISC_MAP = {
    "Physics": "phy",
    "Chemistry": "che",
    "Mathematics": "mat",
    "Biology": "bio",
    "Verbal Abilities": "eng",
    "Quantitative Abilities": "eco",
    "Analytical Abilities": "log",
    "General Knowledge": "gk",
    "Financial Literacy": "fin",
    "AI and Computer Science": "cs",
}
LETTER = {"A": 0, "B": 1, "C": 2, "D": 3}
SUBJECT_ORDER = ["phy", "che", "mat", "bio", "eng", "cs", "eco", "fin", "gk", "log"]


def split_opts(s: str) -> list[str]:
    parts = re.split(r"(?=[A-D]\.\s?)", s.strip())
    opts: list[str] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        match = re.match(r"([A-D])\.\s?(.*)", part, re.S)
        if match:
            opts.append(match.group(2).strip())
    return opts


def parse_level_chunk(chunk: str, level: int) -> list[dict]:
    qsec = re.split(r"Answer Key", chunk, maxsplit=1)[0]
    qblocks = re.split(r"(?m)^(?=\d+\.\s)", qsec)
    qs: list[dict] = []

    for block in qblocks:
        match = re.match(r"(\d+)\.\s+([^\n]+)\n(.+)", block.strip(), re.S)
        if not match:
            continue
        num = int(match.group(1))
        disc = match.group(2).strip()
        body = match.group(3).strip()
        am = re.search(r"\n?A\.\s?", body)
        if not am:
            raise SystemExit(f"No options for L{level} Q{num}")
        stem = body[: am.start()].strip()
        opts = split_opts(body[am.start() :].strip())
        if len(opts) != 4:
            raise SystemExit(f"Bad options L{level} Q{num}: {opts}")
        qs.append(
            {
                "num": num,
                "discipline": disc,
                "subject_id": DISC_MAP[disc],
                "stem": stem,
                "options": opts,
                "level": level,
                "type": None,
            }
        )

    asec = re.split(r"Answer Key[^\n]*", chunk, maxsplit=1)[1]
    lines = [ln.strip() for ln in asec.split("\n") if ln.strip()]
    skip = {"Question", "Discipline", "Correct Answer", "No.", "Explanation"}
    answers: dict[int, int] = {}
    expls: dict[int, str] = {}

    i = 0
    while i < len(lines):
        if lines[i] in skip or not lines[i].isdigit():
            i += 1
            continue
        num = int(lines[i])
        i += 1
        if i >= len(lines):
            break
        i += 1  # discipline
        if i >= len(lines):
            break
        ans = lines[i]
        i += 1
        am = re.match(r"([A-D])\s*[—–-]\s*(.*)", ans)
        if not am:
            raise SystemExit(f"Bad answer L{level} Q{num}: {ans}")
        answers[num] = LETTER[am.group(1)]

        expl_parts: list[str] = []
        while i < len(lines):
            if lines[i].isdigit() and i + 1 < len(lines) and lines[i + 1] in DISC_MAP:
                break
            if lines[i] in skip:
                i += 1
                continue
            expl_parts.append(lines[i])
            i += 1
        if expl_parts:
            expls[num] = " ".join(expl_parts)

    for q in qs:
        if q["num"] not in answers:
            raise SystemExit(f"Missing answer L{level} Q{q['num']}")
        q["correct_index"] = answers[q["num"]]
        q["explanation"] = expls.get(q["num"])
        q["difficulty_rating"] = level * 2 + 1
        q["sort_order"] = SUBJECT_ORDER.index(q["subject_id"]) + 1
        q["id"] = f"l{level}-{q['subject_id']}"
        # Verify correct option exists
        assert 0 <= q["correct_index"] <= 3

    by_subject = {q["subject_id"] for q in qs}
    if by_subject != set(SUBJECT_ORDER):
        raise SystemExit(f"L{level} subjects mismatch: {sorted(by_subject)}")
    if len(qs) != 10:
        raise SystemExit(f"L{level} expected 10 got {len(qs)}")
    return qs


def main() -> None:
    text = TEXT_PATH.read_text(encoding="utf-8")
    chunks = re.split(
        r"(?=LEVEL 1 MCQ|Level-2 Interdisciplinary|Level-3 Interdisciplinary)",
        text,
    )
    all_q: list[dict] = []
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        if chunk.startswith("LEVEL 1"):
            level = 1
        elif chunk.startswith("Level-2"):
            level = 2
        elif chunk.startswith("Level-3"):
            level = 3
        else:
            continue
        qs = parse_level_chunk(chunk, level)
        all_q.extend(qs)
        print(f"Level {level}: {len(qs)} questions OK")
        for q in sorted(qs, key=lambda x: x["sort_order"]):
            ans = q["options"][q["correct_index"]]
            print(
                f"  {q['subject_id']:3} [{q['correct_index']}] "
                f"{q['stem'][:50]} -> {ans[:40]}"
            )

    assert len(all_q) == 30, len(all_q)
    OUT_PATH.write_text(json.dumps(all_q, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({len(all_q)} questions)")


if __name__ == "__main__":
    main()
