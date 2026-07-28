import json
import urllib.request

for level in (1, 2, 3):
    with urllib.request.urlopen(
        f"http://localhost:3001/api/challenge/questions?level={level}"
    ) as response:
        data = json.load(response)
    questions = data.get("questions", [])
    print(f"L{level}: {len(questions)} questions error={data.get('error')}")
    for question in questions:
        answer = question["options"][question["correctIndex"]]
        print(f"  {question['id']:8} {question['subjectId']:3} ans={answer[:50]}")
