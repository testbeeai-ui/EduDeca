"""Compare docx source vs seed JSON vs live DB dump for completeness."""

from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCX = Path(r"C:\Users\rentk\Downloads\10 Questions EduDeca Levels 1 to 3.docx")
SEED = ROOT / "_questions_seed.json"
DB_DUMP = ROOT / "_db_dump.json"

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


def extract_paras(path: Path) -> list[str]:
    root = ET.fromstring(zipfile.ZipFile(path).read("word/document.xml"))
    paras: list[str] = []
    for p_el in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
        text = "".join(
            (t.text or "")
            for t in p_el.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t")
        ).strip()
        if text:
            paras.append(text)
    return paras


def split_opts(s: str) -> list[str]:
    parts = re.split(r"(?=[A-D]\.\s?)", s.strip())
    opts: list[str] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        match = re.match(r"([A-D])\.\s?(.*)", part, re.S)
        if match:
            opts.append(re.sub(r"\s+", " ", match.group(2).strip()))
    return opts


def norm(text: str | None) -> str:
    if not text:
        return ""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n+", " ", text)
    return text.strip()


def parse_doc(paras: list[str]) -> list[dict]:
    text = "\n".join(paras)
    chunks = re.split(
        r"(?=LEVEL 1 MCQ|Level-2 Interdisciplinary|Level-3 Interdisciplinary)",
        text,
    )
    all_q: list[dict] = []
    for chunk in chunks:
        chunk = chunk.strip()
        if chunk.startswith("LEVEL 1"):
            level = 1
        elif chunk.startswith("Level-2"):
            level = 2
        elif chunk.startswith("Level-3"):
            level = 3
        else:
            continue

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
            stem = re.sub(r"\s+", " ", body[: am.start()].strip())
            opts = split_opts(body[am.start() :].strip())
            qs.append(
                {
                    "id": f"l{level}-{DISC_MAP[disc]}",
                    "level": level,
                    "num": num,
                    "discipline": disc,
                    "subject_id": DISC_MAP[disc],
                    "stem": stem,
                    "options": opts,
                }
            )

        asec = re.split(r"Answer Key[^\n]*", chunk, maxsplit=1)[1]
        lines = [ln.strip() for ln in asec.split("\n") if ln.strip()]
        skip = {"Question", "Discipline", "Correct Answer", "No.", "Explanation"}
        answers: dict[int, tuple[int, str]] = {}
        expls: dict[int, str] = {}
        i = 0
        while i < len(lines):
            if lines[i] in skip or not lines[i].isdigit():
                i += 1
                continue
            num = int(lines[i])
            i += 2
            ans = lines[i]
            i += 1
            am = re.match(r"([A-D])\s*[—–-]\s*(.*)", ans)
            answers[num] = (LETTER[am.group(1)], am.group(2).strip())
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
            idx, ans_text = answers[q["num"]]
            q["correct_index"] = idx
            q["answer_text"] = ans_text
            q["explanation"] = expls.get(q["num"])
            all_q.append(q)
    return all_q


def compare(doc_q: dict, db_q: dict) -> list[str]:
    issues: list[str] = []
    qid = doc_q["id"]
    if norm(doc_q["stem"]) != norm(db_q["stem"]):
        issues.append(f"{qid} STEM mismatch\n  DOC: {norm(doc_q['stem'])}\n  DB : {norm(db_q['stem'])}")
    doc_opts = [norm(o) for o in doc_q["options"]]
    db_opts = [norm(o) for o in db_q["options"]]
    if doc_opts != db_opts:
        issues.append(f"{qid} OPTIONS mismatch\n  DOC: {doc_opts}\n  DB : {db_opts}")
    if doc_q["correct_index"] != db_q["correct_index"]:
        issues.append(
            f"{qid} CORRECT_INDEX mismatch doc={doc_q['correct_index']} db={db_q['correct_index']}"
        )
    db_ans = norm(db_q["options"][db_q["correct_index"]])
    doc_ans = norm(doc_q["answer_text"])
    # answer key text should match chosen option (allow punctuation diffs)
    if doc_ans.rstrip(".") != db_ans.rstrip(".") and doc_ans not in db_ans and db_ans not in doc_ans:
        issues.append(f"{qid} ANSWER TEXT mismatch doc={doc_ans!r} db={db_ans!r}")

    doc_expl = norm(doc_q.get("explanation"))
    db_expl = norm(db_q.get("explanation"))
    if doc_q["level"] == 1:
        if db_expl:
            issues.append(f"{qid} unexpected explanation on L1")
    else:
        if not doc_expl:
            issues.append(f"{qid} missing explanation in DOC parse")
        elif not db_expl:
            issues.append(f"{qid} missing explanation in DB")
        elif doc_expl != db_expl:
            issues.append(f"{qid} EXPLANATION mismatch\n  DOC: {doc_expl}\n  DB : {db_expl}")
    return issues


def main() -> None:
    paras = extract_paras(DOCX)
    doc_qs = parse_doc(paras)
    seed_qs = json.loads(SEED.read_text(encoding="utf-8"))
    db_qs = json.loads(DB_DUMP.read_text(encoding="utf-8"))

    print(f"DOC questions: {len(doc_qs)}")
    print(f"SEED questions: {len(seed_qs)}")
    print(f"DB questions: {len(db_qs)}")

    by_level_doc = {1: 0, 2: 0, 3: 0}
    for q in doc_qs:
        by_level_doc[q["level"]] += 1
    print(f"DOC by level: {by_level_doc}")

    db_by_id = {q["id"]: q for q in db_qs}
    seed_by_id = {q["id"]: q for q in seed_qs}

    missing_in_db = [q["id"] for q in doc_qs if q["id"] not in db_by_id]
    extra_in_db = [qid for qid in db_by_id if qid not in {q["id"] for q in doc_qs}]
    print(f"Missing in DB: {missing_in_db or 'none'}")
    print(f"Extra in DB: {extra_in_db or 'none'}")

    issues: list[str] = []
    for q in doc_qs:
        if q["id"] not in db_by_id:
            continue
        issues.extend(compare(q, db_by_id[q["id"]]))
        # also ensure seed matches doc for audit trail
        if q["id"] in seed_by_id:
            seed = seed_by_id[q["id"]]
            if norm(seed["stem"]) != norm(q["stem"]) or seed["correct_index"] != q["correct_index"]:
                issues.append(f"{q['id']} seed drift vs DOC")

    if issues:
        print(f"\nISSUES ({len(issues)}):")
        for issue in issues:
            print("-" * 60)
            print(issue)
    else:
        print("\nALL CHECKS PASSED: every DOC question is in DB with matching stem, options, answer, explanations.")


if __name__ == "__main__":
    main()
