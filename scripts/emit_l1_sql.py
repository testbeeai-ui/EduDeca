"""Emit batched INSERT SQL for Level-1 seed JSON."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROWS = json.loads((ROOT / "_l1_seed.json").read_text(encoding="utf-8"))
OUTDIR = Path(__file__).resolve().parent / "_l1_sql"
BATCH = 30


def lit(value: object) -> str:
    text = str(value).replace("\r\n", "\n").replace("\r", "\n")
    text = " ".join(text.split())
    return "'" + text.replace("'", "''") + "'"


def main() -> None:
    OUTDIR.mkdir(exist_ok=True)
    for old in OUTDIR.glob("*.sql"):
        old.unlink()
    for i in range(0, len(ROWS), BATCH):
        chunk = ROWS[i : i + BATCH]
        values: list[str] = []
        for q in chunk:
            opts = json.dumps(q["options"], ensure_ascii=False)
            expl = "NULL" if q.get("explanation") is None else lit(q["explanation"])
            values.append(
                "("
                f"{lit(q['id'])}, {lit(q['subject_id'])}, 1, {int(q['sort_order'])}, "
                f"{lit(q['stem'])}, {lit(opts)}::jsonb, {int(q['correct_index'])}, "
                f"{expl}, {int(q['difficulty_rating'])}, true)"
            )
        sql = (
            "INSERT INTO public.edudeca_questions "
            "(id, subject_id, level, sort_order, stem, options, correct_index, explanation, difficulty_rating, published) VALUES\n"
            + ",\n".join(values)
            + ";"
        )
        (OUTDIR / f"{i // BATCH:02d}.sql").write_text(sql, encoding="utf-8")
    print(f"wrote {len(list(OUTDIR.glob('*.sql')))} files for {len(ROWS)} rows")


if __name__ == "__main__":
    main()
