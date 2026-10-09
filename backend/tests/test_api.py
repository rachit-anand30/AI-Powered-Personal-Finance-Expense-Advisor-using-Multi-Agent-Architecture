"""End-to-end tests: the FastAPI endpoints and the four demo scenarios through the full multi-agent pipeline."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.main import app

SCENARIOS = {s["id"]: s for s in json.loads(
    (Path(__file__).resolve().parents[2] / "frontend" / "src" / "data" / "scenarios.json").read_text(encoding="utf-8"))}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def batch(scenario_id):
    s = SCENARIOS[scenario_id]
    return {"user_id": "test", "monthly_income": s["income"], "transactions": s["transactions"]}


def full(client, scenario_id, query=None):
    s = SCENARIOS[scenario_id]
    r = client.post("/full_analysis", json={"batch": batch(scenario_id), "user_query": query or s["query"], "saving_goal": s["saving_goal"]})
    assert r.status_code == 200, r.text
    return r.json()


# ---------------------------------------------------------------- endpoints

def test_health(client):
    body = client.get("/").json()
    assert body["status"] == "ok"
    assert len(body["agents"]) == 7 and body["ml_classifier"]["ready"]


def test_every_endpoint_responds(client):
    b = batch("normal")
    assert client.post("/analyze_expenses", json=b).status_code == 200
    assert client.post("/create_budget", json=b).status_code == 200
    assert client.post("/predict_expenses", json=b).status_code == 200
    assert client.post("/get_financial_advice", json={"batch": b, "user_query": "How can I save more?"}).status_code == 200
    assert client.post("/investment_plan", json={"batch": b}).status_code == 200
    assert client.get("/model_info").json()["holdout_accuracy"] >= 85
    assert client.post("/classify", json=["Swiggy", "Uber"]).json()[1]["category"] == "Transport"


def test_upload_and_retrieve(client):
    r = client.post("/upload_transactions", json=batch("warning"))
    assert r.status_code == 200 and r.json()["count"] == len(SCENARIOS["warning"]["transactions"])
    stored = client.get("/get_transactions/test").json()["transactions"]
    assert len(stored) >= r.json()["count"]


def test_csv_upload(client):
    csv_text = "date,description,amount\n2026-08-01,Swiggy,450\n2026-08-02,Uber,230\n2026-08-03,Bad row,-5\n"
    r = client.post("/upload_csv", files={"file": ("t.csv", csv_text, "text/csv")}, data={"user_id": "csv", "monthly_income": "30000"})
    body = r.json()
    assert r.status_code == 200 and body["count"] == 2 and len(body["skipped_rows"]) == 1


def test_validation_rejects_bad_input(client):
    bad = {"user_id": "u", "monthly_income": 1000, "transactions": [{"date": "2026-08-01", "description": "x", "amount": -10}]}
    assert client.post("/analyze_expenses", json=bad).status_code == 422
    assert client.post("/analyze_expenses", json={**bad, "monthly_income": -1, "transactions": []}).status_code == 422


def test_empty_batch(client):
    body = client.post("/full_analysis", json={"batch": {"user_id": "u", "monthly_income": 0, "transactions": []}}).json()
    assert body["expense_analysis"]["monthly_total"] == 0
    assert body["anomalies"]["flagged_transactions"] == []


def test_pipeline_trace_and_messages(client):
    body = full(client, "fraud")
    assert [t["agent"] for t in body["trace"]] == ["Expense Analyzer", "Anomaly Detection", "Budget Planner",
                                                    "Prediction", "Investment", "Advisor"]
    assert all(t["status"] == "ok" for t in body["trace"])
    handoffs = {(m["from"], m["to"]) for m in body["messages"]}
    assert ("Anomaly Detection", "Prediction") in handoffs and ("Budget Planner", "Investment") in handoffs


# ---------------------------------------------------------------- demo scenarios (README)

def test_scenario_normal(client):
    body = full(client, "normal")
    assert body["anomalies"]["flagged_transactions"] == []
    assert body["budget_plan"]["budget_health_score"] >= 80
    assert body["investment_plan"]["investable_surplus"] > 0


def test_scenario_fraud(client):
    body = full(client, "fraud")
    flagged = body["anomalies"]["flagged_transactions"]
    assert len(flagged) == 1 and flagged[0]["amount"] == 75000
    assert body["anomalies"]["risk_level"] == "High"
    assert body["predictions"]["excluded_one_offs"] == 75000
    assert body["advice"]["top_recommendations"][0]["priority"] == "high"
    assert body["advice"]["response_to_query"]["intent"] == "fraud"


def test_scenario_budget_warning(client):
    body = full(client, "warning")
    plan = body["budget_plan"]
    assert plan["risk_level"] == "High" and plan["budget_health_score"] < 65
    assert plan["optimization"]["goal_reached"]
    assert "Food" in plan["optimization"]["cuts"]


def test_scenario_prediction(client):
    body = full(client, "prediction")
    p = body["predictions"]
    assert p["prediction_method"] == "Linear Regression"
    assert p["trend_direction"] == "Increasing" and p["risk_level"] == "High"
    assert p["predicted_expense"] > p["monthly_history"][-1]["amount"]


def test_afford_question(client):
    body = full(client, "normal", query="Can I afford a ₹60,000 laptop?")
    answer = body["advice"]["response_to_query"]
    assert answer["intent"] == "afford" and answer["entities"]["amount"] == 60000
