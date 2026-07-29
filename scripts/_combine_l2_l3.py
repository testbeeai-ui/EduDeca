from pathlib import Path

# Emit SQL for levels 2 and 3 as a single migration body for copy/apply
body = Path("scripts/_seed_l2.sql").read_text(encoding="utf-8") + "\n" + Path("scripts/_seed_l3.sql").read_text(encoding="utf-8")
Path("scripts/_seed_l2_l3_combined.sql").write_text(body, encoding="utf-8")
print(len(body))
