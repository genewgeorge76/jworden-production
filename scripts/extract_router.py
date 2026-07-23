import json

with open('debug_router.json') as f:
    payload_str = json.load(f)

payload = json.loads(payload_str)
strings = [x for x in payload if isinstance(x, str)]
for i, s in enumerate(strings):
    if "id" in s or "status" in s:
        print(f"Index {i}: {s}")
