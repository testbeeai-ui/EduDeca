from pathlib import Path

lines = [
    l
    for l in Path("scripts/_seed_questions_l1_l3_mcp.sql").read_text(encoding="utf-8").splitlines()
    if l.startswith("INSERT")
]
for level in (1, 2, 3):
    prefix = f"VALUES ('l{level}-"
    chunk = [l for l in lines if prefix in l]
    Path(f"scripts/_seed_l{level}.sql").write_text("\n".join(chunk) + "\n", encoding="utf-8")
    print(level, len(chunk))
