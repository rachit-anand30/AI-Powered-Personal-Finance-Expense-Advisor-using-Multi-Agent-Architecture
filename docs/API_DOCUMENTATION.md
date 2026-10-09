# 🌐 API Documentation

Base URL: `http://localhost:8000`. Interactive Swagger docs: **`http://localhost:8000/docs`**.

## Common payload: `TransactionBatch`
```json
{
  "user_id": "demo_user",
  "monthly_income": 60000,
  "transactions": [
    { "date": "2026-09-01", "description": "House Rent", "amount": 15000 },
    { "date": "2026-09-06", "description": "SWIGY*ORDER 8812", "amount": 420 },
    { "date": "2026-09-12", "description": "Netflix", "amount": 649, "category": "Entertainment" }
  ]
}
```
Validation (HTTP 422 on failure): `amount > 0`, non-empty `description`, ISO `date`,
`monthly_income ≥ 0`. `category` and per-transaction `user_id` are optional. Missing categories
are filled in by the ML classifier.

---

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/` | – | Status, agent list, ML classifier info, storage mode |
| POST | `/full_analysis` | `{batch, user_query?, saving_goal?}` | **Everything**: all six agents' outputs + `categorized_transactions`, `trace`, `messages`, `logs` |
| POST | `/analyze_expenses` | `TransactionBatch` | Expense Analyzer output |
| POST | `/create_budget?saving_goal=` | `TransactionBatch` | Budget plan incl. `optimization` (search result) |
| POST | `/predict_expenses` | `TransactionBatch` | Forecast (one-off anomalies excluded) |
| POST | `/get_financial_advice` | `{batch, user_query?, saving_goal?}` | Advisor output incl. `response_to_query` |
| POST | `/investment_plan` | `{batch, saving_goal?}` | Investment agent output |
| POST | `/upload_transactions` | `TransactionBatch` | Stores the batch + expense analysis |
| POST | `/upload_csv` | multipart: `file`, `user_id`, `monthly_income` | Parsed transactions, skipped rows with reasons, analysis |
| POST | `/classify` | `["Swiggy", "UPI/rapido@ybl/ride"]` | Category, source (ml/rules/default), confidence per description |
| GET | `/model_info` | – | Algorithm, training size, CV and hold-out accuracy |
| GET | `/get_transactions/{user_id}` | – | Stored transactions |

---

## `/full_analysis` response (abridged, Fraud scenario)
```json
{
  "expense_analysis": {
    "category_wise_spending": {"Bills": 52524, "Shopping": 80400, "...": 0},
    "monthly_total": 55053.0, "months_covered": 3, "investments_total": 15000,
    "savings_rate": 8.2, "overspending_alerts": ["Shopping"], "risk_level": "High"
  },
  "anomalies": {
    "flagged_transactions": [{
      "description": "INTL POS LUXE WATCHES DUBAI", "amount": 75000, "category": "Shopping",
      "modified_z_score": 205.38, "times_typical": 136.4,
      "detected_by": ["Modified Z-score", "Z-score", "Isolation Forest"], "confidence": 100
    }],
    "risk_level": "High"
  },
  "budget_plan": {
    "budget_health_score": 100.0, "savings_rate": 49.9, "risk_level": "Low",
    "budget_allocation": {"needs_budget": 30000, "wants_budget": 18000, "savings_budget": 12000},
    "actual_allocation": {"needs_spent": 22549, "wants_spent": 7504, "savings": 29947},
    "optimization": {"cuts": {}, "goal_reached": true, "nodes_expanded": 0,
                     "strategy": "Greedy best-first search (priority queue on pain per rupee)"},
    "excluded_flagged_amount": 75000,
    "warnings": ["₹75,000 in flagged transactions is excluded from this plan until you verify it."]
  },
  "predictions": {
    "prediction_method": "Linear Regression", "predicted_expense": 30953.33, "confidence": 79.4,
    "next_month": "2026-10", "trend_direction": "Stable", "excluded_one_offs": 75000
  },
  "investment_plan": {"risk_profile": "Balanced", "investable_surplus": 29946.67, "monthly_plan": ["..."]},
  "advice": {
    "summary": "Security alert: 1 suspicious transaction worth ₹75,000 needs your attention right away. ...",
    "top_recommendations": [{"title": "Verify ₹75,000 at INTL POS LUXE WATCHES DUBAI", "priority": "high", "agent": "Anomaly Detection", "impact_amount": 75000, "description": "..."}],
    "response_to_query": {"query": "Is there anything suspicious?", "intent": "fraud", "entities": {"category": null, "amount": null}, "answer": "..."}
  },
  "trace": [{"agent": "Expense Analyzer", "status": "ok", "reads": ["transactions", "monthly_income"], "writes": "expense_analysis", "summary": "...", "duration_ms": 45.6}],
  "messages": [{"from": "Anomaly Detection", "to": "Prediction", "content": "Exclude 1 one-off transaction(s) worth ₹75,000 from the forecast."}],
  "logs": ["[Coordinator] Dispatching Expense Analyzer agent...", "..."]
}
```

## Errors
- **422:** validation error (FastAPI detail list). The UI shows it inline.
- **500:** an agent failed. `detail` = `{ "error": "<Agent> agent failed: …", "logs": [...] }`.
- **400:** CSV missing the required `date`, `description` or `amount` columns.
