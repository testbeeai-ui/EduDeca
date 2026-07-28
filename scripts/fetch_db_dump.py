"""Fetch live edudeca_questions into _db_dump.json then audit against docx."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.strip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def main() -> None:
    env = load_env()
    url = (
        env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
        + "/rest/v1/edudeca_questions"
        + "?select=id,subject_id,level,sort_order,stem,options,correct_index,explanation,difficulty_rating,published"
        + "&order=level.asc,sort_order.asc"
    )
    req = urllib.request.Request(
        url,
        headers={
            "apikey": env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
            "Authorization": f"Bearer {env['NEXT_PUBLIC_SUPABASE_ANON_KEY']}",
        },
    )
    with urllib.request.urlopen(req) as response:
        rows = json.load(response)
    out = ROOT / "_db_dump.json"
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out} count={len(rows)}")


if __name__ == "__main__":
    main()
