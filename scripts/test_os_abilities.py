import sys, json
sys.path.insert(0, '.')
from app.services.os_ability_service import search_os_abilities, execute_os_ability

print("=== TEST 1: Search age decay ===")
r = search_os_abilities("age decay simulation asphalt")
for res in r["results"][:3]:
    print(f"  [{res['relevance']}] {res['module_id']}")
    print(f"     {res['description'][:90]}")

print()
print("=== TEST 2: Search ground penetrating radar ===")
r = search_os_abilities("ground penetrating radar utility scanning")
for res in r["results"][:3]:
    print(f"  [{res['relevance']}] {res['module_id']}")

print()
print("=== TEST 3: Search real estate underwriting ===")
r = search_os_abilities("real estate bank underwriting hard money lender")
for res in r["results"][:3]:
    print(f"  [{res['relevance']}] {res['module_id']}")

print()
print("=== TEST 4: Execute age_decay_simulator ===")
r = execute_os_ability("VisionAndIntelligence.age_decay_simulator", {})
if r.get("ok"):
    print("  OK:", json.dumps(r["result"], indent=2)[:500])
else:
    print("  ERROR:", r.get("error"))

print()
print("=== TEST 5: Execute dynamic_routing_engine ===")
r = execute_os_ability("OperationalAndDispatch.dynamic_routing_engine", {"truck_id": "TRK-42"})
if r.get("ok"):
    print("  OK:", json.dumps(r["result"], indent=2)[:500])
else:
    print("  ERROR:", r.get("error"))

print()
print("=== TEST 6: Execute bank_underwriting_intelligence ===")
r = execute_os_ability("FinTechAndBanking.bank_underwriting_intelligence", {})
if r.get("ok"):
    print("  OK:", json.dumps(r["result"], indent=2)[:500])
else:
    print("  ERROR:", r.get("error"))
