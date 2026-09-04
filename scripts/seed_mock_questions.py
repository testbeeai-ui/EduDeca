"""Seed edudeca_mock_questions only. Never writes the Daily Challenge pool."""

from __future__ import annotations

import base64
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from parse_l1_docx import DOC_PATH, parse_level1_docx
from parse_mock_docx import L2_DOC_PATH, L3_DOC_PATH, parse_level2_docx, parse_level3_docx, to_mock_rows

MOCK_TABLE = "edudeca_mock_questions"
FORBIDDEN_TABLE = "edudeca_discipline_questions"
BATCH = 80
ROOT = Path(__file__).resolve().parents[1]


def _jwt_role(token: str) -> str:
    try:
        payload = token.split(".")[1]
        pad = "=" * (-len(payload) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload + pad).decode("utf-8"))
        return str(decoded.get("role") or "")
    except Exception:
        return ""


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for path in (ROOT / ".env", ROOT / ".env.local", ROOT.parent / "Web" / ".env"):
        if not path.is_file():
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            value = value.strip().strip('"').strip("'")
            if not value:
                continue
            lowered = value.lower()
            if lowered.startswith(("your_", "changeme", "placeholder")):
                continue
            name = key.strip()
            if name == "SUPABASE_SERVICE_ROLE_KEY" and _jwt_role(value) != "service_role":
                continue
            values[name] = value
    return values


def collect_rows() -> list[dict]:
    rows = []
    rows.extend(to_mock_rows(parse_level1_docx(DOC_PATH), level=1))
    rows.extend(parse_level2_docx(L2_DOC_PATH))
    rows.extend(parse_level3_docx(L3_DOC_PATH))
    if len(rows) != 1440:
        raise SystemExit(f"Expected 1440 mock rows, got {len(rows)}")
    by_level = {1: 0, 2: 0, 3: 0}
    for row in rows:
        by_level[int(row["level"])] += 1
        if not str(row["id"]).startswith("mock-l"):
            raise SystemExit(f"Refusing non-mock id {row['id']}")
    if by_level != {1: 240, 2: 480, 3: 720}:
        raise SystemExit(f"Unexpected level counts {by_level}")
    return rows


def payload_for(row: dict) -> dict:
    return {
        "id": row["id"],
        "level": int(row["level"]),
        "set_number": int(row["set_number"]),
        "discipline_id": row["discipline_id"],
        "sort_order": int(row["sort_order"]),
        "stem": row["stem"],
        "options": row["options"],
        "correct_index": int(row["correct_index"]),
        "explanation": row.get("explanation"),
        "difficulty_rating": row.get("difficulty_rating"),
        "type": row.get("type"),
        "published": True,
    }


def post_batch(url: str, key: str, batch: list[dict]) -> None:
    if MOCK_TABLE != "edudeca_mock_questions":
        raise SystemExit("Refusing unexpected mock table")
    endpoint = f"{url}/rest/v1/{MOCK_TABLE}"
    if FORBIDDEN_TABLE in endpoint:
        raise SystemExit("Refusing to write the challenge pool")
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


def count_table(url: str, key: str, table: str) -> int:
    req = urllib.request.Request(
        f"{url}/rest/v1/{table}?select=id",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Prefer": "count=exact",
            "Range": "0-0",
        },
    )
    with urllib.request.urlopen(req) as resp:
        cr = resp.headers.get("content-range") or resp.headers.get("Content-Range") or ""
        if "/" in cr:
            return int(cr.split("/")[-1])
        return 0


def main() -> None:
    env = load_env()
    url = (env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not url or not key:
        raise SystemExit("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    # PostgREST 401/42501 happens if this is the anon key after we revoked anon writes.
    role = ""
    try:
        payload = key.split(".")[1]
        pad = "=" * (-len(payload) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload + pad).decode("utf-8"))
        role = str(decoded.get("role") or "")
    except Exception:
        role = ""
    if role and role != "service_role":
        raise SystemExit(f"SUPABASE_SERVICE_ROLE_KEY is role={role}, not service_role")
    rows = [payload_for(row) for row in collect_rows()]
    print(f"Seeding {len(rows)} rows into {MOCK_TABLE}")
    for i in range(0, len(rows), BATCH):
        chunk = rows[i : i + BATCH]
        post_batch(url, key, chunk)
        print(f"  {i + 1}-{i + len(chunk)}")
    mock_count = count_table(url, key, MOCK_TABLE)
    pool_count = count_table(url, key, FORBIDDEN_TABLE)
    print(f"{MOCK_TABLE}={mock_count} {FORBIDDEN_TABLE}={pool_count}")
    if mock_count != 1440:
        raise SystemExit(f"Expected 1440 seeded mock rows, got {mock_count}")


if __name__ == "__main__":
    main()
