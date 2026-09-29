# 🧠 PEAS Formulation Documentation

This document outlines the detailed PEAS (Performance, Environment, Actuators, Sensors) formulations for the Complete System as well as the individual agents making up the Multi-Agent System.

---

## 1. Complete System PEAS

### Performance Measures (P)
- **Expense classification accuracy:** Target > 90%
- **Budget recommendation adherence rate:** User success in following budget
- **Anomaly detection metrics:** High precision and recall for fraudulent transactions
- **Prediction accuracy:** Low MAE and RMSE (< 10% error)
- **User satisfaction score:** System rating and engagement
- **Savings improvement rate:** Month-over-month savings growth
- **False positive rate:** Minimal false fraud alerts

### Environment (E)
- **Dynamic:** Spending patterns change monthly based on seasons/lifestyle.
- **Partially Observable:** The agent cannot see cash transactions or hidden financial accounts.
- **Sequential:** Current spending habits strongly affect future financial health.
- **Stochastic:** Unexpected emergencies or sudden expenses occur unpredictably.
- **Multi-agent:** Multiple specialized AI sub-agents collaborate to achieve the goal.
- **Episodic within month, Sequential across months:** Monthly budgets reset, but overall wealth is cumulative.

### Actuators (A)
- Generate optimized budget recommendations
- Create personalized spending limits by category
- Send real-time fraud alerts and UI notifications
- Predict future expenses and render forecast charts
- Generate natural language advice and explanations
- Adjust the budget dynamically based on new spending data

### Sensors (S)
- Transaction history inputs (CSV/JSON payload)
- Monthly income data
- User-configured spending preferences and limits
- Savings goals (e.g., target ₹50,000 for vacation)
- Historical spending patterns across previous months
- Real-time transaction API feeds

---

## 2. Expense Analyzer Agent PEAS (Team Member 1)
- **Performance (P):** Categorization accuracy, speed of processing, overspending detection rate.
- **Environment (E):** Raw transaction data stream, historical user spending history.
- **Actuators (A):** Category labels assigned to data, spending alert flags, risk indicators.
- **Sensors (S):** Transaction descriptions, precise amounts, dates/timestamps.

## 3. Anomaly Detection Agent PEAS (Team Member 1)
- **Performance (P):** Precision/Recall of fraud detection, strict minimization of false positive rate.
- **Environment (E):** Processed transaction amounts, temporal spending patterns.
- **Actuators (A):** Fraud alert notifications, anomaly boolean flags, numeric risk scores (1-100).
- **Sensors (S):** Transaction numerical amounts, statistical distributions, calculated Z-scores.

## 4. Budget Planning Agent PEAS (Team Member 2)
- **Performance (P):** Budget adherence success rate, overall savings achieved by the user.
- **Environment (E):** User income stream, categorized expense analysis, long-term saving goals.
- **Actuators (A):** Allocated category budgets, strict spending limits, projected saving targets.
- **Sensors (S):** Monthly declared income, categorized expenses from Analyzer, user-defined goals.

## 5. Prediction Agent PEAS (Team Member 2)
- **Performance (P):** Prediction accuracy (Mean Absolute Error < 10%), reliable trend detection.
- **Environment (E):** Historical categorized transaction data, time-series metrics over multiple months.
- **Actuators (A):** Future expense forecasts by category, future risk assessments, projected savings.
- **Sensors (S):** Monthly aggregated expense history, statistical trend data.

## 6. Coordinator Agent PEAS (Team Member 3)
- **Performance (P):** System response completeness, latency/coordination efficiency, user satisfaction.
- **Environment (E):** Asynchronous outputs from all other agents, direct user API requests.
- **Actuators (A):** Orchestrated multi-agent responses, scheduled task assignments to sub-agents.
- **Sensors (S):** User query inputs, internal agent status signals, combined system state data.

## 7. Advisor Agent PEAS (Team Member 3)
- **Performance (P):** Recommendation quality, linguistic actionability, user acceptance rate of advice.
- **Environment (E):** Complete multi-agent analysis outputs, real-time user context and goals.
- **Actuators (A):** Natural language text recommendations, visual financial insight summaries.
- **Sensors (S):** Expense analysis results, budget plans, predictions, anomaly alerts.
