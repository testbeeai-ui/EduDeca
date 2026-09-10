"""Seed edudeca_discipline_questions from the DIsiplines Word banks.

Never writes edudeca_mock_questions.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from parse_discipline_bank_docx import BANK_DIR, collect_discipline_banks
from seed_mock_questions import count_table, load_env

POOL_TABLE = "edudeca_discipline_questions"
FORBIDDEN_TABLE = "edudeca_mock_questions"
BATCH = 80


def payload_for(row: dict) -> dict:
    if str(row["id"]).startswith("mock-"):
        raise SystemExit(f"Refusing mock id {row['id']}")
    return {
        "id": row["id"],
        "discipline_id": row["discipline_id"],
        "level": int(row["level"]),
        "sort_order": int(row["sort_order"]),
        "stem": row["stem"],
        "options": row["options"],
        "correct_index": int(row["correct_index"]),
        "explanation": row.get("explanation"),
        "difficulty_rating": row.get("difficulty_rating"),
        "type": row.get("type"),
        "chapter": row.get("chapter"),
        "class_level": row.get("class_level"),
        "published": True,
    }


def post_batch(url: str, key: str, batch: list[dict]) -> None:
    if POOL_TABLE != "edudeca_discipline_questions":
        raise SystemExit("Refusing unexpected pool table")
    endpoint = f"{url}/rest/v1/{POOL_TABLE}"
    if FORBIDDEN_TABLE in endpoint:
        raise SystemExit("Refusing to write the mock bank")
    body = json.dumps(batch).encode("utf-8")
    req = urllib.request.Request(
        endpoint + "?on_conflict=id",
        data=body,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status not in (200, 201, 204):
                raise SystemExit(f"Seed HTTP {resp.status}")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Seed failed {exc.code}: {detail[:800]}") from exc


def main() -> None:
    env = load_env()
    url = (env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not url or not key:
        raise SystemExit("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    rows = [payload_for(row) for row in collect_discipline_banks(BANK_DIR)]
    if not rows:
        raise SystemExit("No discipline-bank rows to seed")
    ids = [row["id"] for row in rows]
    if len(ids) != len(set(ids)):
        raise SystemExit("Duplicate ids in parsed bank")
    mock_before = count_table(url, key, FORBIDDEN_TABLE)
    print(f"Seeding {len(rows)} rows into {POOL_TABLE}")
    for i in range(0, len(rows), BATCH):
        chunk = rows[i : i + BATCH]
        post_batch(url, key, chunk)
        print(f"  {i + 1}-{i + len(chunk)}")
    pool_count = count_table(url, key, POOL_TABLE)
    mock_after = count_table(url, key, FORBIDDEN_TABLE)
    print(f"{POOL_TABLE}={pool_count} {FORBIDDEN_TABLE}={mock_after}")
    if pool_count != len(rows):
        raise SystemExit(f"Expected {len(rows)} pool rows, got {pool_count}")
    if mock_after != mock_before:
        raise SystemExit(
            f"Mock bank changed during pool seed: {mock_before} -> {mock_after}"
        )


if __name__ == "__main__":
    main()
