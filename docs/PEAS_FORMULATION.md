# 🧠 PEAS Formulation

PEAS (Performance measure, Environment, Actuators, Sensors) for the whole system and for each of the
seven agents. Every item below maps to something the code actually measures, outputs or reads. File
references point at the implementation.

---

## 1. Complete system

| | |
|---|---|
| **Performance** | • Classification accuracy on **unseen merchants**: **94%** (hand-labelled hold-out set, `backend/data/classifier_test_set.csv`), 98.7% 5-fold CV<br>• **Zero false fraud alerts** on normal months (rent, EMIs, SIPs, recurring merchants are never flagged), and every planted fraud is caught (tests `test_normal_month_has_no_false_alarms`, `test_scenario_fraud`)<br>• Forecast fit: R² of the regression line, reported as the confidence %<br>• Budget health score 0–100 and savings rate vs the 20% target<br>• End-to-end latency: all six agents finish in ~100 ms for 56 transactions |
| **Environment** | Individual user's bank/UPI statement history plus their declared income and goals (see §9 for the environment classification) |
| **Actuators** | Category labels · fraud alerts with detector votes · 50/30/20 plan and per-category limits · cut recommendations · next-month forecast · investment plan · ranked natural-language recommendations and answers to questions · React dashboard |
| **Sensors** | Transactions via JSON (`/full_analysis`, `/upload_transactions`) or CSV upload (`/upload_csv`): date, free-text description, amount, optional category · monthly income · optional savings goal · optional natural-language question |

---

## 2. Expense Analyzer Agent (TM1): `agents/expense_analyzer_agent.py`
- **P:** hold-out classification accuracy (94%); share of transactions labelled by the ML model vs rules; correct monthly averages across multi-month data.
- **E:** noisy free-text descriptions (`"SWIGY*ORDER 8812"`, `"UPI/zomato@okhdfc/Payment"`), mixed with refunds and investment transfers.
- **A:** writes `category`, `category_source` (ml / rules / user) and `category_confidence` onto every transaction; emits category totals, monthly average, savings rate, overspending alerts and a risk level.
- **S:** description text, amount, date, user-given category, monthly income.

## 3. Anomaly Detection Agent (TM1): `agents/anomaly_detection_agent.py`
- **P:** precision (no alerts on expected spending) and recall (planted frauds caught); confidence = share of the 3 detectors that agree.
- **E:** the distribution of the user's own transaction amounts, which is heavily right-skewed (lots of small UPI payments, one big rent).
- **A:** flagged transactions with `detected_by`, modified z-score, "× typical" multiple and confidence; alert messages; risk level. Tells the Budget and Prediction agents to set flagged amounts aside.
- **S:** amounts, merchant names (for recurring-merchant detection), descriptions (for fixed-commitment detection), income.

## 4. Budget Planning Agent (TM2): `agents/budget_planning_agent.py`
- **P:** budget health score, savings rate, whether the cut-search reaches the savings goal (`goal_reached`) and how many nodes it expands.
- **E:** monthly category spending, income, optional savings goal, list of unverified (flagged) charges.
- **A:** 50/30/20 allocation, per-category recommended limits, cut plan, warnings ordered by severity, tips targeted at the worst categories, risk level.
- **S:** Expense Analyzer output, Anomaly output, income, savings goal.

## 5. Prediction Agent (TM2): `agents/prediction_agent.py`
- **P:** R²-based confidence; trend direction; risk = forecast ÷ income.
- **E:** monthly spending time-series (one-off frauds and investment transfers removed).
- **A:** next-month forecast, predicted savings (can be negative), trend, risk, history for the chart.
- **S:** transactions, income, the Anomaly agent's exclusion list.

## 6. Investment Agent (TM3): `agents/investment_agent.py`
- **P:** emergency-fund coverage time; allocation that sums exactly to the surplus; plan paused when cash flow is negative.
- **E:** monthly surplus and risk signals from other agents.
- **A:** risk profile (Conservative / Balanced / Aggressive), monthly split (emergency fund, equity, debt, gold), step-by-step ladder, SIP growth projection.
- **S:** Budget Planner's actual allocation and savings rate, Prediction risk, Anomaly risk, existing investments.

## 7. Advisor Agent (TM3): `agents/advisor_agent.py`
- **P:** every recommendation is backed by a number from another agent; correct intent on test questions (5/5 in `test_advisor_intent_detection`).
- **E:** all agents' outputs plus free-text user questions.
- **A:** summary, priority-ranked recommendations tagged with the source agent, savings opportunities found in transaction text (subscriptions, food delivery), risk narrative, answer to the question with detected intent and entities.
- **S:** blackboard contents, raw transactions, the question text.

## 8. Coordinator Agent (TM3): `agents/coordinator_agent.py`
- **P:** pipeline completes with all six agents `ok`; per-agent latency; graceful failure (HTTP 500 with the log, never a half-built response).
- **E:** the shared blackboard and incoming API requests.
- **A:** dispatches agents in dependency order, writes results to the blackboard, records the trace (reads → writes, summary, ms) and the inter-agent message bus.
- **S:** request payload, each agent's return value or exception.

---

## 9. Environment classification

| Property | Classification | Why |
|---|---|---|
| Observability | **Partially observable** | Cash spending, other bank accounts and the *intent* behind a charge (fraud or genuine?) are invisible, which is why flagged charges are "set aside until verified" rather than declared fraud. |
| Determinism | **Stochastic** | Emergencies, festivals and price changes make next month uncertain, so forecasts carry a confidence value. |
| Episodic / sequential | **Sequential** across months (savings compound, habits trend), episodic within one analysis request. |
| Static / dynamic | **Dynamic** | Spending patterns drift; the Lifestyle Creep scenario shows the forecaster catching it. |
| Discrete / continuous | **Continuous** amounts and time, discretised into categories and months for reasoning. |
| Agents | **Multi-agent, cooperative** | Six specialist agents share one goal (the user's financial health) and pass findings to each other through the coordinator's blackboard. |
| Known / unknown | **Partially known** | Rules like 50/30/20 are known; the user's personal spending distribution has to be learned from data. |
