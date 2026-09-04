"""Emit SQL chunks for edudeca_mock_questions only (never the challenge pool)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from seed_mock_questions import MOCK_TABLE, collect_rows, payload_for

OUTDIR = Path(__file__).resolve().parent / "_mock_seed_sql"
CHUNK = 120


def main() -> None:
    if MOCK_TABLE != "edudeca_mock_questions":
        raise SystemExit("Refusing unexpected table")
    OUTDIR.mkdir(exist_ok=True)
    for old in OUTDIR.glob("*.sql"):
        old.unlink()
    rows = [payload_for(row) for row in collect_rows()]
    for i in range(0, len(rows), CHUNK):
        chunk = rows[i : i + CHUNK]
        payload = json.dumps(chunk, ensure_ascii=False)
        sql = (
            f"INSERT INTO public.{MOCK_TABLE} "
            "(id, level, set_number, discipline_id, sort_order, stem, options, "
            "correct_index, explanation, difficulty_rating, published, type)\n"
            "SELECT id, level, set_number, discipline_id, sort_order, stem, options, "
            "correct_index, explanation, difficulty_rating, published, type\n"
            "FROM json_to_recordset($mockjson$"
            + payload
            + "$mockjson$) AS x(\n"
            "  id text, level smallint, set_number smallint, discipline_id text,\n"
            "  sort_order smallint, stem text, options jsonb, correct_index smallint,\n"
            "  explanation text, difficulty_rating smallint, published boolean, type text\n"
            ")\n"
            "ON CONFLICT (id) DO UPDATE SET\n"
            "  stem = EXCLUDED.stem,\n"
            "  options = EXCLUDED.options,\n"
            "  correct_index = EXCLUDED.correct_index,\n"
            "  difficulty_rating = EXCLUDED.difficulty_rating,\n"
            "  type = EXCLUDED.type,\n"
            "  published = EXCLUDED.published;"
        )
        path = OUTDIR / f"c{i // CHUNK:02d}.sql"
        path.write_text(sql, encoding="utf-8")
        print(path.name, len(chunk), path.stat().st_size)


if __name__ == "__main__":
    main()
