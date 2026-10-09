import pytest
from datetime import date
from backend.agents.expense_analyzer_agent import ExpenseAnalyzerAgent
from backend.agents.anomaly_detection_agent import AnomalyDetectionAgent
from backend.agents.budget_planning_agent import BudgetPlanningAgent
from backend.agents.prediction_agent import PredictionAgent
from backend.agents.investment_agent import InvestmentAgent
from backend.agents.advisor_agent import AdvisorAgent
from backend.services.ml_service import ml_service

@pytest.fixture
def expense_agent():
    return ExpenseAnalyzerAgent()

@pytest.fixture
def anomaly_agent():
    return AnomalyDetectionAgent()

@pytest.fixture
def budget_agent():
    return BudgetPlanningAgent()

def tx(d, desc, amount, **extra):
    return {"date": d, "description": desc, "amount": amount, **extra}

# ---------------------------------------------------------------- original core cases

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
    analysis = expense_agent.analyze_transactions([])
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
    assert "Food" in analysis["overspending_alerts"]

# Test Case 4: Abnormal transaction → fraud detection
def test_fraud_detection(anomaly_agent):
    transactions = [
        tx("2026-08-01", "Rent", 15000, category="Bills"),
        tx("2026-08-02", "Swiggy", 400, category="Food"),
        tx("2026-08-03", "Uber", 300, category="Transport"),
        tx("2026-08-04", "Shopping", 75000, category="Shopping"),
    ]
    anomalies = anomaly_agent.detect_all_anomalies(transactions)
    assert len(anomalies["flagged_transactions"]) == 1
    assert anomalies["flagged_transactions"][0]["amount"] == 75000

# Test Case 5: Low income with high expenses → budget warning
def test_low_income_high_expenses(budget_agent):
    expense_analysis = {"category_wise_spending": {"Bills": 25000, "Shopping": 10000}}
    plan = budget_agent.create_budget(30000, expense_analysis)
    assert len(plan["warnings"]) > 0
    assert plan["budget_health_score"] < 50
    assert plan["risk_level"] == "High"

# ---------------------------------------------------------------- ML / NLP classification

def test_ml_classifier_trains_and_generalises():
    info = ml_service.train()
    assert info["ready"]
    assert info["holdout_accuracy"] >= 85, "accuracy on unseen merchants dropped"

@pytest.mark.parametrize("description,expected", [
    ("SWIGY*ORDER 8812", "Food"),                 # typo + statement noise
    ("UPI/zomato@okhdfc/Payment", "Food"),        # UPI handle
    ("BookMyShow", "Entertainment"),              # used to be "Education" via the 'book' keyword
    ("Business lunch", "Food"),                   # used to be "Transport" via 'bus'
    ("Supermarket groceries", "Food"),            # used to be "Shopping" via 'market'
    ("SIP HDFC Mutual Fund", "Investments"),
])
def test_noisy_descriptions(expense_agent, description, expected):
    assert expense_agent.categorize_transaction(description) == expected

def test_unknown_merchant_is_others(expense_agent):
    result = expense_agent.classify("Unknown Intl Merchant")
    assert result["category"] == "Others"

def test_user_category_is_respected(expense_agent):
    t = [tx("2026-08-01", "Swiggy", 500, category="Entertainment")]
    expense_agent.analyze_transactions(t)
    assert t[0]["category"] == "Entertainment" and t[0]["category_source"] == "user"

def test_refunds_and_investments_are_not_spending(expense_agent):
    analysis = expense_agent.analyze_transactions([
        tx("2026-08-01", "Swiggy", 500), tx("2026-08-02", "Refund", -200), tx("2026-08-03", "Zerodha", 5000),
    ], monthly_income=10000)
    assert analysis["monthly_total"] == 500
    assert analysis["investments_total"] == 5000

def test_monthly_total_averages_over_months(expense_agent):
    analysis = expense_agent.analyze_transactions([
        tx("2026-07-01", "Swiggy", 1000), tx("2026-08-01", "Swiggy", 3000),
    ])
    assert analysis["months_covered"] == 2 and analysis["monthly_total"] == 2000

def test_risk_uses_income(expense_agent):
    txns = [tx("2026-08-01", "House Rent", 9000), tx("2026-08-05", "Swiggy", 1000)]
    assert expense_agent.analyze_transactions([dict(t) for t in txns], monthly_income=10500)["risk_level"] == "High"
    assert expense_agent.analyze_transactions([dict(t) for t in txns], monthly_income=60000)["risk_level"] == "Low"

# ---------------------------------------------------------------- anomaly detection

def test_normal_month_has_no_false_alarms(anomaly_agent):
    transactions = [tx(f"2026-08-{i:02d}", d, a) for i, (d, a) in enumerate(
        [("Rent", 15000), ("Swiggy", 450), ("Uber", 230), ("Amazon", 1200), ("Jio", 299), ("Coffee", 180)], 1)]
    assert anomaly_agent.detect_all_anomalies(transactions)["flagged_transactions"] == []

def test_recurring_merchant_not_flagged(anomaly_agent):
    transactions = []
    for m in ("07", "08", "09"):
        transactions += [tx(f"2026-{m}-01", "BigBasket", 4000), tx(f"2026-{m}-05", "Uber", 200),
                         tx(f"2026-{m}-09", "Swiggy", 300), tx(f"2026-{m}-12", "Coffee", 150)]
    assert anomaly_agent.detect_all_anomalies(transactions)["flagged_transactions"] == []

def test_small_unusual_purchase_not_flagged_when_income_known(anomaly_agent):
    transactions = [tx(f"2026-08-{i:02d}", f"Shop {i}", 400 + i * 10) for i in range(1, 12)]
    transactions.append(tx("2026-08-20", "Myntra jacket", 4000))
    assert anomaly_agent.detect_all_anomalies(transactions)["flagged_transactions"]            # unusual vs history...
    assert anomaly_agent.detect_all_anomalies(transactions, monthly_income=60000)["flagged_transactions"] == []  # ...but < 10% of income

def test_anomaly_reports_methods_and_high_risk(anomaly_agent):
    transactions = [tx(f"2026-08-{i:02d}", f"Shop {i}", 300 + i * 10) for i in range(1, 12)]
    transactions.append(tx("2026-08-20", "INTL POS DUBAI", 80000))
    result = anomaly_agent.detect_all_anomalies(transactions, monthly_income=50000)
    flagged = result["flagged_transactions"][0]
    assert flagged["description"] == "INTL POS DUBAI"
    assert "Modified Z-score" in flagged["detected_by"] and flagged["confidence"] >= 67
    assert result["risk_level"] == "High"

# ---------------------------------------------------------------- budget search

def test_budget_search_closes_gap_and_spares_essentials(budget_agent):
    expense_analysis = {"category_wise_spending": {"Bills": 12000, "Food": 3000, "Shopping": 3500}, "months_covered": 1}
    plan = budget_agent.create_budget(20000, expense_analysis)
    opt = plan["optimization"]
    assert opt["goal_reached"]
    assert opt["total_saved"] >= 2500                       # target 4000 - current 1500
    assert "Bills" not in opt["cuts"]                        # rent is the last thing to cut
    assert opt["cuts"]["Shopping"] > opt["cuts"].get("Food", 0)
    assert plan["recommended_budget"]["Shopping"] < 3500

def test_budget_health_reflects_savings(budget_agent):
    healthy = budget_agent.create_budget(60000, {"category_wise_spending": {"Bills": 15000, "Food": 5000}})
    tight = budget_agent.create_budget(20000, {"category_wise_spending": {"Bills": 12000, "Food": 3000, "Shopping": 3500}})
    assert healthy["budget_health_score"] == 100
    assert tight["budget_health_score"] < 65 and tight["risk_level"] == "High"

def test_higher_saving_goal_shrinks_wants(budget_agent):
    plan = budget_agent.create_budget(50000, {"category_wise_spending": {"Food": 5000}}, saving_goal=15000)
    assert plan["budget_allocation"]["savings_budget"] == 15000
    assert plan["budget_allocation"]["wants_budget"] == 10000

def test_flagged_charge_counts_in_health_but_not_in_cuts(budget_agent):
    anomalies = {"flagged_transactions": [{"amount": 75000, "category": "Shopping"}]}
    plan = budget_agent.create_budget(60000, {"category_wise_spending": {"Bills": 15000, "Shopping": 76000}}, anomalies=anomalies)
    assert plan["flagged_amount"] == 75000
    assert plan["budget_health_score"] < 50                 # real cash flow: the money did leave the account
    assert plan["actual_allocation"]["savings"] == 60000 - 91000
    assert plan["baseline_savings"] == 60000 - 16000        # what savings would be after a refund
    assert plan["optimization"]["cuts"] == {}               # no "cut Shopping" because of a one-off

def test_monthly_scores_use_each_month(budget_agent, expense_agent):
    txns = [tx("2026-07-01", "House Rent", 15000), tx("2026-08-01", "House Rent", 15000), tx("2026-08-05", "Myntra", 32000)]
    analysis = expense_agent.analyze_transactions(txns, monthly_income=50000)
    scores = {m["month"]: m for m in budget_agent.create_budget(50000, analysis)["monthly_scores"]}
    assert scores["2026-07"]["spent"] == 15000 and scores["2026-07"]["budget_health_score"] == 100
    assert scores["2026-08"]["spent"] == 47000 and scores["2026-08"]["risk_level"] == "High"

def test_monthly_breakdown_and_top_expenses(expense_agent):
    txns = [tx("2026-08-01", "Swiggy", 300), tx("2026-08-02", "Zomato", 900), tx("2026-08-03", "Swiggy", 500),
            tx("2026-08-04", "Dominos", 700), tx("2026-09-01", "Swiggy", 100)]
    analysis = expense_agent.analyze_transactions(txns)
    aug = analysis["monthly_breakdown"][0]
    assert aug["month"] == "2026-08" and aug["total"] == 2400 and aug["transaction_count"] == 4
    assert [t["amount"] for t in aug["top_expenses"]["Food"]] == [900, 700, 500]
    assert len(analysis["top_expenses"]["Food"]) == 3

def test_zero_income_is_handled(budget_agent):
    plan = budget_agent.create_budget(0, {"category_wise_spending": {"Food": 100}})
    assert plan["budget_health_score"] == 0 and "income" in plan["warnings"][0].lower()

# ---------------------------------------------------------------- prediction

def test_linear_trend_prediction():
    txns = [tx("2026-05-01", "Rent", 20000), tx("2026-06-01", "Rent", 22000), tx("2026-07-01", "Rent", 24000)]
    p = PredictionAgent().predict_future_expenses(txns, 50000)
    assert p["prediction_method"] == "Linear Regression"
    assert p["predicted_expense"] == pytest.approx(26000)
    assert p["trend_direction"] == "Increasing" and p["next_month"] == "2026-08"
    assert p["confidence"] > 85  # perfect linear fit

def test_prediction_excludes_one_offs():
    txns = [tx("2026-07-01", "Food", 10000), tx("2026-08-01", "Food", 10000), tx("2026-08-09", "Watch", 75000)]
    p = PredictionAgent().predict_future_expenses(txns, 50000, exclude_signatures={"2026-08-09_Watch_75000"})
    assert p["predicted_expense"] == 10000 and p["excluded_one_offs"] == 75000

# ---------------------------------------------------------------- investment agent

def test_investment_plan_with_surplus():
    budget = {"actual_allocation": {"needs_spent": 20000, "wants_spent": 10000, "savings": 30000}, "savings_rate": 50}
    plan = InvestmentAgent().create_investment_plan(60000, budget, {"risk_level": "Low"}, {"risk_level": "Low"})
    assert plan["risk_profile"] == "Aggressive"
    assert sum(p["amount"] for p in plan["monthly_plan"]) == pytest.approx(30000)
    assert plan["emergency_fund_target"] == 180000

def test_investment_paused_on_deficit():
    budget = {"actual_allocation": {"needs_spent": 15000, "wants_spent": 8000, "savings": -3000}, "savings_rate": -15}
    plan = InvestmentAgent().create_investment_plan(20000, budget, {"risk_level": "High"}, {"risk_level": "Low"})
    assert plan["investable_surplus"] == 0 and plan["monthly_plan"] == []

# ---------------------------------------------------------------- advisor NLP

@pytest.mark.parametrize("query,intent", [
    ("Can I afford a ₹30,000 phone?", "afford"),
    ("how can i save on food", "category"),
    ("Where should I invest?", "invest"),
    ("Is there anything suspicious?", "fraud"),
    ("What will I spend next month?", "forecast"),
])
def test_advisor_intent_detection(query, intent):
    assert AdvisorAgent().detect_intent(query)["intent"] == intent

@pytest.mark.parametrize("text,amount", [("₹30,000 phone", 30000), ("rs 4500", 4500), ("a 25k laptop", 25000), ("1.5 lakh car", 150000)])
def test_amount_extraction(text, amount):
    assert AdvisorAgent.extract_amount(text) == amount

# ---------------------------------------------------------------- running (incomplete) month

def test_in_progress_month_kept_out_of_averages(expense_agent, budget_agent):
    txns = [tx("2026-08-01", "House Rent", 15000), tx("2026-09-01", "House Rent", 15000), tx("2026-10-03", "Swiggy", 500)]
    analysis = expense_agent.analyze_transactions(txns, monthly_income=50000, today=date(2026, 10, 9))
    assert analysis["in_progress_month"] == "2026-10"
    assert analysis["months_covered"] == 2 and analysis["monthly_total"] == 15000   # not dragged down by October
    october = analysis["monthly_breakdown"][-1]
    assert october["month"] == "2026-10" and october["in_progress"] and october["total"] == 500

def test_forecast_targets_running_month():
    txns = [tx("2026-07-01", "Rent", 20000), tx("2026-08-01", "Rent", 22000), tx("2026-09-01", "Rent", 24000),
            tx("2026-10-02", "Rent", 3000)]
    p = PredictionAgent().predict_future_expenses(txns, 50000, today=date(2026, 10, 9))
    assert p["next_month"] == "2026-10" and p["in_progress_month"] == "2026-10"
    assert p["predicted_expense"] == pytest.approx(26000)                         # fitted on Jul-Sep only
    assert p["month_to_date"] == 3000 and p["monthly_history"][-1]["in_progress"]

def test_one_offs_can_be_included_in_forecast():
    from backend.agents.coordinator_agent import CoordinatorAgent
    txns = [tx(f"2026-0{m}-{d:02d}", f"Shop {d}", 300 + d * 10) for m in (7, 8, 9) for d in range(1, 8)]
    txns.append(tx("2026-09-20", "INTL POS DUBAI", 80000))
    c = CoordinatorAgent()
    without = c.process_user_request([dict(t) for t in txns], 50000)["predictions"]["predicted_expense"]
    with_one_offs = c.process_user_request([dict(t) for t in txns], 50000, include_one_offs=True)["predictions"]["predicted_expense"]
    assert with_one_offs > without + 10000
