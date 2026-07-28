"""Build INSERT SQL for edudeca_questions from _questions_seed.json."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
qs = json.loads((ROOT / "_questions_seed.json").read_text(encoding="utf-8"))


def lit(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


rows: list[str] = []
for q in qs:
    opts = json.dumps(q["options"], ensure_ascii=False)
    expl = "NULL" if not q.get("explanation") else lit(q["explanation"])
    rows.append(
        "("
        f"{lit(q['id'])}, {lit(q['subject_id'])}, {q['level']}, {q['sort_order']}, "
        f"{lit(q['stem'])}, {lit(opts)}::jsonb, {q['correct_index']}, {expl}, "
        f"{q['difficulty_rating']}, true)"
    )

sql = (
    "INSERT INTO edudeca_questions "
    "(id, subject_id, level, sort_order, stem, options, correct_index, explanation, difficulty_rating, published) "
    "VALUES\n"
    + ",\n".join(rows)
    + "\nON CONFLICT (id) DO UPDATE SET "
    "subject_id = EXCLUDED.subject_id, "
    "level = EXCLUDED.level, "
    "sort_order = EXCLUDED.sort_order, "
    "stem = EXCLUDED.stem, "
    "options = EXCLUDED.options, "
    "correct_index = EXCLUDED.correct_index, "
    "explanation = EXCLUDED.explanation, "
    "difficulty_rating = EXCLUDED.difficulty_rating, "
    "published = EXCLUDED.published;"
)

out = ROOT / "_questions_seed.sql"
out.write_text(sql, encoding="utf-8")
print(f"wrote {out} rows={len(rows)} bytes={len(sql)}")
