"""Build Level-3 INSERT SQL with PostgreSQL single-quoted strings."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
qs = [
    q
    for q in json.loads((ROOT / "_questions_seed.json").read_text(encoding="utf-8"))
    if q["level"] == 3
]


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


parts: list[str] = []
for q in qs:
    opts_json = json.dumps(q["options"], ensure_ascii=False)
    expl = "NULL" if not q.get("explanation") else sql_str(q["explanation"])
    parts.append(
        "("
        f"{sql_str(q['id'])}, "
        f"{sql_str(q['subject_id'])}, "
        f"{q['level']}, {q['sort_order']}, "
        f"{sql_str(q['stem'])}, "
        f"{sql_str(opts_json)}::jsonb, "
        f"{q['correct_index']}, {expl}, {q['difficulty_rating']}, true)"
    )

sql = (
    "INSERT INTO edudeca_questions "
    "(id, subject_id, level, sort_order, stem, options, correct_index, explanation, difficulty_rating, published) "
    "VALUES\n"
    + ",\n".join(parts)
    + ";"
)
(ROOT / "_questions_l3.sql").write_text(sql, encoding="utf-8")
print(f"rows={len(parts)} bytes={len(sql)}")
