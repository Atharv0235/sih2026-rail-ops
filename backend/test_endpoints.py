"""Full integration test for all RAIL-OPS endpoints."""
import requests
import json

BASE = "http://localhost:8000"

print("=" * 60)
print("TEST 1: GET /api/dashboard/kpis")
print("=" * 60)
r = requests.get(f"{BASE}/api/dashboard/kpis")
print(f"Status: {r.status_code}")
print(json.dumps(r.json(), indent=2))

print("\n" + "=" * 60)
print("TEST 2: GET /api/health")
print("=" * 60)
r = requests.get(f"{BASE}/api/health")
print(f"Status: {r.status_code}")
print(json.dumps(r.json(), indent=2))

print("\n" + "=" * 60)
print("TEST 3: GET /api/defects")
print("=" * 60)
r = requests.get(f"{BASE}/api/defects")
print(f"Status: {r.status_code}, Count: {len(r.json())}")

print("\n" + "=" * 60)
print("TEST 4: GET /api/blocks")
print("=" * 60)
r = requests.get(f"{BASE}/api/blocks")
print(f"Status: {r.status_code}, Count: {len(r.json())}")

print("\n" + "=" * 60)
print("TEST 5: GET /api/live")
print("=" * 60)
r = requests.get(f"{BASE}/api/live")
print(f"Status: {r.status_code}, Count: {len(r.json())}")

print("\n" + "=" * 60)
print("TEST 6: POST /api/optimize (CP-SAT solver)")
print("=" * 60)
r = requests.post(f"{BASE}/api/optimize", json={
    "corridor_key": "BPL-DIV",
    "date_start": "2026-09-20T00:00:00",
    "date_end": "2026-09-27T00:00:00",
})
print(f"Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"Solver: {data['solver_backend']}")
    print(f"Clusters: {data['clusters_formed']}")
    print(f"Blocks: {len(data['blocks'])}")
    print(f"Defects covered: {data['defects_covered']}")
    print(f"Shadow multiplier: {data['total_shadow_multiplier']}")
    print(f"Downtime saved: {data['estimated_downtime_saved_mins']} mins")
    print(f"Unscheduled: {data['unscheduled_count']}")
    if data["blocks"]:
        b = data["blocks"][0]
        print(f"First block: {b['id']} on {b['corridor_section_id']}")
        print(f"  {b['start_time']} -> {b['end_time']} ({b['duration_mins']}min)")
        print(f"  Tasks: {len(b.get('packed_tasks', []))}")
    # Save a section ID for the reschedule test
    test_section = data["blocks"][0]["corridor_section_id"] if data["blocks"] else None
else:
    print(f"Error: {r.text[:200]}")
    test_section = None

print("\n" + "=" * 60)
print("TEST 7: POST /api/reschedule")
print("=" * 60)
sec = test_section or "BPL-DIV-SEC-004"
r = requests.post(f"{BASE}/api/reschedule", json={
    "train_id": "12345-Shatabdi",
    "train_name": "Shatabdi Express",
    "delay_mins": 45,
    "section_id": sec,
    "planned_time_mins": 120,
})
print(f"Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"Result: {data['status']}")
    print(f"Message: {data['message']}")
    print(f"Tier: {data['tier_used']} ({data.get('tier_label', 'n/a')})")
    print(f"Blocks affected: {data.get('blocks_affected', 0)}")
    for d in data.get("diffs", []):
        print(f"  - {d['task_id']}: {d['reason']}")
else:
    print(f"Error: {r.text[:300]}")

print("\n" + "=" * 60)
print("ALL TESTS COMPLETE")
print("=" * 60)
