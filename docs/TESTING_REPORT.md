# 🧪 Testing Report

**Result: 50 / 50 tests passing** (`pytest backend/tests/ -v`, Python 3.14, about 8 s).

| Suite | File | Tests | Covers |
|---|---|---|---|
| Agent unit tests | `backend/tests/test_agents.py` | 38 | Every agent in isolation, including the 5 original core cases |
| API + scenario tests | `backend/tests/test_api.py` | 12 | Every endpoint through FastAPI's TestClient, validation, CSV upload, the agent trace, and all four demo scenarios end-to-end |

## 1. Original core cases (kept)
| # | Case | Expected | Status |
|---|---|---|---|
| 1 | Valid transactions | Correct totals, Food and Transport detected | ✅ |
| 2 | Empty input | Zero totals, Low risk, no crash | ✅ |
| 3 | High spending pattern | Food overspending alert | ✅ |
| 4 | ₹75,000 abnormal charge | Exactly that one transaction flagged | ✅ |
| 5 | Low income, high expenses | Warnings, health < 50, **High** risk | ✅ |

## 2. Bugs found during review, now locked in by regression tests
| Bug in the earlier version | Test |
|---|---|
| Isolation Forest flagged **rent in a normal month** (`contamination=0.1` always flags 10%) | `test_normal_month_has_no_false_alarms` |
| Recurring grocery orders flagged as fraud in multi-month data | `test_recurring_merchant_not_flagged` |
| ₹20k income with ₹18.5k spent scored **93/100** | `test_budget_health_reflects_savings`, `test_scenario_budget_warning` |
| Keyword matching: BookMyShow → Education, Business lunch → Transport, Supermarket → Shopping | `test_noisy_descriptions` |
| Refunds (negative amounts) counted as spending and triggered alerts | `test_refunds_and_investments_are_not_spending`, `test_validation_rejects_bad_input` |
| Multi-month data compared as one "month" against monthly income | `test_monthly_total_averages_over_months` |
| Risk level ignored income (₹92k spend on ₹50k income = "Medium") | `test_risk_uses_income` |
| Frontend called endpoints that didn't exist and always showed hardcoded demo data | UI now calls `/full_analysis`, verified in the browser |

## 3. ML classifier
- `test_ml_classifier_trains_and_generalises`: hold-out accuracy on unseen merchants must stay ≥ 85% (currently **94%**).
- Noisy inputs: `SWIGY*ORDER 8812`, `UPI/zomato@okhdfc/Payment` → Food.

## 4. Search, prediction, investment, advisor
- The budget search closes the gap, never cuts rent, and prefers Shopping over Food.
- A higher saving goal shrinks Wants. Flagged charges are excluded from the budget.
- Perfect linear data gives a forecast of exactly ₹26,000 with > 85% confidence. One-offs are excluded.
- No investment plan when in deficit, and the allocation sums exactly to the surplus.
- Advisor: 5 intents and 4 amount formats (`₹30,000`, `rs 4500`, `25k`, `1.5 lakh`).

## 5. Demo scenarios (end-to-end through the API)
| Scenario | Assertions |
|---|---|
| Healthy Saver | 0 anomalies, health ≥ 80, investable surplus > 0 |
| Fraud Detection | exactly the ₹75,000 charge flagged, fraud risk High, excluded from forecast, top recommendation is high priority |
| Budget Warning | risk High, health < 65, search reaches goal and cuts Food |
| Lifestyle Creep | Linear Regression, trend Increasing, forecast risk High, forecast > last month |

## 6. Manual UI verification
Run in the browser with the live backend:
- All 8 tabs render with no console errors and no horizontal overflow at 375 px.
- A custom transaction `UPI/rapido@ybl/ride` was classified as Transport (ML 96%) and the full pipeline re-ran.
- The chat question "Can I afford a 60k laptop?" returned intent `afford`, amount 60000, and 2.0 months of surplus.
- With the backend stopped, the UI falls back to a labelled snapshot and shows the start command.
