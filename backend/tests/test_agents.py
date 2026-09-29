import pytest
from datetime import date
from backend.agents.expense_analyzer_agent import ExpenseAnalyzerAgent
from backend.agents.anomaly_detection_agent import AnomalyDetectionAgent
from backend.agents.budget_planning_agent import BudgetPlanningAgent

@pytest.fixture
def expense_agent():
    return ExpenseAnalyzerAgent()

@pytest.fixture
def anomaly_agent():
    return AnomalyDetectionAgent()

@pytest.fixture
def budget_agent():
    return BudgetPlanningAgent()

# Test Case 1: Valid transaction input → correct expense analysis
def test_valid_transaction_analysis(expense_agent):
    transactions = [
        {"date": date(2026, 8, 1), "description": "Swiggy", "amount": 500},
        {"date": date(2026, 8, 2), "description": "Uber", "amount": 300},
    ]
    analysis = expense_agent.analyze_transactions(transactions)
    assert analysis["monthly_total"] == 800
    assert "Food" in analysis["category_wise_spending"]
    assert "Transport" in analysis["category_wise_spending"]

# Test Case 2: Missing transaction values → error handling
def test_missing_transaction_values(expense_agent):
    transactions = []
    analysis = expense_agent.analyze_transactions(transactions)
    assert analysis["monthly_total"] == 0.0
    assert analysis["highest_expense_category"] is None
    assert analysis["risk_level"] == "Low"

# Test Case 3: High spending pattern → overspending alert
def test_high_spending_pattern(expense_agent):
    transactions = [
        {"date": date(2026, 8, 1), "description": "Swiggy", "amount": 5000},
        {"date": date(2026, 8, 2), "description": "Uber", "amount": 100},
    ]
    analysis = expense_agent.analyze_transactions(transactions)
    assert len(analysis["overspending_alerts"]) > 0
    assert "Food" in analysis["overspending_alerts"]

# Test Case 4: Abnormal transaction → fraud detection
def test_fraud_detection(anomaly_agent):
    transactions = [
        {"date": "2026-08-01", "description": "Rent", "amount": 15000, "category": "Bills"},
        {"date": "2026-08-02", "description": "Swiggy", "amount": 400, "category": "Food"},
        {"date": "2026-08-03", "description": "Uber", "amount": 300, "category": "Transport"},
        {"date": "2026-08-04", "description": "Shopping", "amount": 75000, "category": "Shopping"},
    ]
    anomalies = anomaly_agent.detect_all_anomalies(transactions)
    assert len(anomalies["flagged_transactions"]) > 0
    assert anomalies["flagged_transactions"][0]["amount"] == 75000

# Test Case 5: Low income with high expenses → budget warning
def test_low_income_high_expenses(budget_agent):
    expense_analysis = {
        "category_wise_spending": {
            "Bills": 25000, # Needs
            "Shopping": 10000 # Wants
        }
    }
    monthly_income = 30000
    plan = budget_agent.create_budget(monthly_income, expense_analysis)
    assert len(plan["warnings"]) > 0
    assert plan["budget_health_score"] < 100
