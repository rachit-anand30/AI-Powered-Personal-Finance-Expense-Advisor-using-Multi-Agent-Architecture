# 🏗️ Multi-Agent Architecture

## 1. Why multiple agents?

Personal finance needs very different kinds of reasoning: text classification, robust statistics,
search-based optimisation, time-series regression, rule-based planning and language generation. Each
agent owns exactly one of these, has its own inputs and outputs, and can be tested on its own (see
`backend/tests/test_agents.py`). Swapping an algorithm, for example a different classifier, touches
one file.

## 2. Architecture

```text
            React dashboard (Vite + Tailwind + Recharts)
                               │  JSON / CSV over HTTP
                         FastAPI REST API
                               │
                 ┌─────────────┴──────────────┐
                 │     COORDINATOR AGENT      │   blackboard + trace + message bus
                 └─────────────┬──────────────┘
                               │ dispatches in dependency order
  ┌────────────┬───────────────┼──────────────┬─────────────┬────────────┐
  ▼            ▼               ▼              ▼             ▼            ▼
Expense ──▶ Anomaly ──▶ Budget Planner   Prediction ──▶ Investment ──▶ Advisor
Analyzer    Detection     (TM2)            (TM2)          (TM3)         (TM3)
 (TM1)       (TM1)          ▲                ▲              ▲
   │           ├──── set aside flagged ──────┘              │
   │           └──── ignore one-offs ───────────────────────┘ (via Budget/Prediction risk)
   └── ML/NLP classifier (TF-IDF + Logistic Regression)
```

## 3. Communication: blackboard pattern

The coordinator keeps a **blackboard**, a shared dictionary. It holds the request
(`transactions`, `monthly_income`, `saving_goal`, `user_query`), and each agent's result is written
back under its own key. Each agent declares what it **reads**:

| # | Agent | Reads | Writes |
|---|---|---|---|
| 1 | Expense Analyzer | transactions, monthly_income | `expense_analysis` (and labels each transaction) |
| 2 | Anomaly Detection | transactions, expense_analysis | `anomalies` |
| 3 | Budget Planner | expense_analysis, anomalies, monthly_income, saving_goal | `budget_plan` |
| 4 | Prediction | transactions, anomalies, monthly_income | `predictions` |
| 5 | Investment | budget_plan, predictions, anomalies | `investment_plan` |
| 6 | Advisor | everything above + user_query | `advice` |

After each agent runs, the coordinator posts explicit **hand-off messages** to a message bus. These
are returned in the API response as `messages` and shown on the **Agents** tab:

```json
{"from": "Anomaly Detection", "to": "Prediction",
 "content": "Exclude 1 one-off transaction(s) worth ₹75,000 from the forecast."}
```

It also records a **trace** entry per agent: reads → writes, a one-line summary and runtime in ms.
If any agent raises, the pipeline stops, and the API returns HTTP 500 with the log so far. It never
returns a half-filled response.

## 4. Interactions that change the outcome

These are not just data passing. Each one changes another agent's result:

1. **Expense Analyzer → everyone:** ML category labels decide what counts as Needs, Wants or
   Investments, and which transactions the fraud detector even looks at.
2. **Anomaly → Budget Planner:** a flagged ₹75,000 charge still counts in actual spending and the health
   score (the money did leave the account), but the cut search ignores it, so the planner does **not** tell
   the user to "cut Shopping by ₹6,700/month" because of a fraud.
3. **Anomaly → Prediction:** the same charge is excluded from the time series, so the forecast stays
   at about ₹31k instead of jumping because of a one-off.
4. **Budget + Prediction + Anomaly → Investment:** surplus sets how much can be invested, and the
   forecast and fraud risk set the risk profile. A rising forecast pushes Arjun to *Conservative*
   despite a 34% savings rate.
5. **All → Advisor:** recommendations are ranked by priority and tagged with the agent that produced
   the evidence.

## 5. Agent types

| Agent | Type | Reasoning |
|---|---|---|
| Expense Analyzer | Learning agent | Supervised text classifier trained at startup, with rule-based fallback |
| Anomaly Detection | Reactive (model-based) | Compares each transaction against a model of the user's normal distribution |
| Budget Planner | **Goal-based** | Searches the space of cuts for a state that satisfies the savings goal |
| Prediction | Model-based | Fits a regression model of spending over time |
| Investment | Utility-based (rule-encoded) | Trades off safety (emergency fund, insurance) against growth by risk profile |
| Advisor | Goal-based / communicative | Maps the user's intent to the most relevant evidence |
| Coordinator | Orchestrator | Schedules agents by data dependency, manages the blackboard |

## 6. Demo scenarios: what each agent does

| Scenario | Key agent behaviour |
|---|---|
| Healthy Saver | 0 alerts (recurring BigBasket and SIP not flagged) · health 100 · Investment: *Aggressive* |
| Fraud Detection | ₹75,000 flagged by **all 3** detectors (136× typical) · September health drops to 26 · ignored by the cut search and forecast trend · Advisor leads with a security alert |
| Budget Warning | savings rate 7.5% → health 59, **High** risk · search expands 26 nodes, cuts Shopping/Food/Transport/Entertainment, leaves rent alone |
| Lifestyle Creep | Linear Regression, 93% confidence, forecasts ₹63.8k on ₹70k income → **High** forecast risk, trend Increasing |

## 7. Scalability notes
- Agents are stateless, so one coordinator instance is shared across requests (`routers/deps.py`).
- Adding an agent means one class plus one row in `CoordinatorAgent.PIPELINE` and one runner.
- Storage is MongoDB (`motor`, async), with an automatic in-memory fallback when Mongo is not
  running, so the demo needs no database.
- The ML model trains in under a second at startup. For a large training set it could be saved with
  `joblib` instead.
