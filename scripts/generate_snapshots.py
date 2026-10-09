"""Run every demo scenario through the real multi-agent pipeline and save the results.

The frontend calls the live API; these snapshots are only shown (clearly labelled
"offline snapshot") when the backend is not running, so a demo never shows a blank screen.

Usage:  python scripts/generate_snapshots.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.agents.coordinator_agent import CoordinatorAgent  # noqa: E402

SCENARIOS = ROOT / "frontend" / "src" / "data" / "scenarios.json"
OUT = ROOT / "frontend" / "src" / "data" / "snapshots.json"


def main():
    coordinator = CoordinatorAgent()
    snapshots = {}
    for s in json.loads(SCENARIOS.read_text(encoding="utf-8")):
        txns = [{**t, "user_id": "demo_user"} for t in s["transactions"]]
        result = coordinator.process_user_request(txns, s["income"], s.get("query"), s.get("saving_goal"))
        if "error" in result:
            raise SystemExit(f"{s['id']}: {result['error']}")
        snapshots[s["id"]] = result
        print(f"{s['id']:<11} health={result['budget_plan']['budget_health_score']:>5}  "
              f"anomalies={len(result['anomalies']['flagged_transactions'])}  "
              f"forecast=₹{result['predictions']['predicted_expense']:,.0f}  risk={result['budget_plan']['risk_level']}")
    OUT.write_text(json.dumps(snapshots, ensure_ascii=False, default=str), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
