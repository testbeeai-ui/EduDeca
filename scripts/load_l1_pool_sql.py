"""Build INSERT SQL for the Level-1 discipline pool."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from parse_l1_docx import DOC_PATH, parse_level1_docx

OUTDIR = Path(__file__).resolve().parent / "_l1_pool_sql"
BATCH = 12


def sql_str(value: object) -> str:
    text = str(value).replace("\r\n", "\n").replace("\r", "\n")
    if "\n" in text:
        escaped = text.replace("\\", "\\\\").replace("'", "''").replace("\n", "\\n")
        return "E'" + escaped + "'"
    return "'" + text.replace("'", "''") + "'"


def options_sql(options: list[str]) -> str:
    return "jsonb_build_array(" + ", ".join(sql_str(opt) for opt in options) + ")"


def rows_from_docx() -> list[dict]:
    questions = parse_level1_docx(DOC_PATH)
    rows: list[dict] = []
    for q in questions:
        disc = q["subject_id"]
        slot = int(q["sort_order"])
        rows.append(
            {
                "id": f"l1-{disc}-{slot:02d}",
                "discipline_id": disc,
                "sort_order": slot,
                "stem": q["stem"],
                "options": q["options"],
                "correct_index": int(q["correct_index"]),
                "difficulty_rating": q.get("difficulty_rating"),
                "type": q.get("type"),
            }
        )
    return rows


def sql_for(chunk: list[dict]) -> str:
    values: list[str] = []
    for row in chunk:
        diff = (
            "NULL"
            if row["difficulty_rating"] is None
            else str(int(row["difficulty_rating"]))
        )
        typ = "NULL" if not row["type"] else sql_str(row["type"])
        values.append(
            "("
            + ", ".join(
                [
                    sql_str(row["id"]),
                    sql_str(row["discipline_id"]),
                    "1",
                    str(int(row["sort_order"])),
                    sql_str(row["stem"]),
                    options_sql(row["options"]),
                    str(int(row["correct_index"])),
                    "NULL",
                    diff,
                    "true",
                    typ,
                ]
            )
            + ")"
        )
    return (
        "INSERT INTO public.edudeca_discipline_questions "
        "(id, discipline_id, level, sort_order, stem, options, correct_index, "
        "explanation, difficulty_rating, published, type) VALUES\n"
        + ",\n".join(values)
        + "\nON CONFLICT (id) DO NOTHING;"
    )


def main() -> None:
    OUTDIR.mkdir(exist_ok=True)
    for old in OUTDIR.glob("j*.sql"):
        old.unlink()
    rows = rows_from_docx()
    for i in range(0, len(rows), BATCH):
        chunk = rows[i : i + BATCH]
        path = OUTDIR / f"j{i // BATCH:02d}.sql"
        path.write_text(sql_for(chunk), encoding="utf-8")
        print(path.name, chunk[0]["id"], "->", chunk[-1]["id"], path.stat().st_size)


if __name__ == "__main__":
    main()
