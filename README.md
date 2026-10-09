# 🌟 AI-Powered Personal Finance & Expense Advisor

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi) ![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-orange?logo=scikitlearn) ![React](https://img.shields.io/badge/React-18-blue?logo=react) ![Tests](https://img.shields.io/badge/tests-50%20passing-brightgreen)

A **multi-agent AI system** that reads your bank/UPI statement and does the following:
- classifies every transaction with an **NLP + ML model**;
- catches **fraud** with a three-detector ensemble;
- **searches** for the least painful way to hit your savings goal;
- **forecasts** next month's spending;
- plans where to **invest** the surplus;
- answers questions in **plain English** ("Can I afford a ₹30,000 phone?").

| Topic requirement | Where it lives |
|---|---|
| Expense classification using ML | TF-IDF (word + char n-grams) + Logistic Regression, **94% accuracy on unseen merchants** (`services/ml_service.py`) |
| NLP for transaction descriptions | Normalisation of noisy UPI/POS strings, char n-grams for typos, intent + entity extraction in the Advisor |
| Spending prediction | Linear Regression with R²-based confidence / Moving Average (`agents/prediction_agent.py`) |
| Budget recommendation | 50/30/20 + **greedy best-first search** over spending cuts (`agents/budget_planning_agent.py`) |
| Multiple AI agents (budget, investment, alert) | 6 specialist agents + coordinator on a shared blackboard, with an inter-agent message bus |

## 🏗️ Architecture

```text
            React dashboard (8 tabs, live agent trace, advisor chat)
                               │  REST (JSON / CSV)
                         FastAPI backend
                               │
                 ┌─────────────┴──────────────┐
                 │     COORDINATOR AGENT      │  blackboard · trace · message bus
                 └─────────────┬──────────────┘
  ┌────────────┬───────────────┼──────────────┬─────────────┬────────────┐
  ▼            ▼               ▼              ▼             ▼            ▼
Expense ──▶ Anomaly ──▶ Budget Planner   Prediction ──▶ Investment ──▶ Advisor
Analyzer    Detection   (50/30/20 +      (LinReg /      (risk-profile   (intent NLP +
(ML/NLP)    (3-detector  best-first      Moving Avg)     SIP plan)       data-driven
             ensemble)   search)                                         advice)
```
Agents don't just run one after another; they change each other's results. The Anomaly agent tells
the Budget Planner and Prediction agent to **set aside** a fraudulent charge, so a ₹75,000 fraud
neither distorts the forecast nor produces a bogus "cut Shopping" recommendation. Details:
[docs/AGENT_ARCHITECTURE.md](docs/AGENT_ARCHITECTURE.md).

## 👥 Team
| Member | Agents | Focus |
|---|---|---|
| **Team Member 1** | Expense Analyzer, Anomaly Detection | ML/NLP classification, fraud detection, PEAS |
| **Team Member 2** | Budget Planner, Prediction | Search-based optimisation, forecasting, algorithms |
| **Team Member 3** | Coordinator, Investment, Advisor | Orchestration, API, UI, architecture |

## 🛠️ Tech stack and why
| Package | Used for | Why this choice |
|---|---|---|
| **FastAPI + Pydantic** | REST API, input validation | Auto Swagger docs at `/docs`, typed validation (422 on bad data) |
| **scikit-learn** | TF-IDF, Logistic Regression, Isolation Forest, Linear Regression | Standard, fast, explainable classical ML; trains in < 1 s |
| **NumPy / SciPy** | Z-scores, MAD, polyfit fallback | Lightweight numerics |
| **Motor (MongoDB)** | Transaction storage | Async driver; **falls back to in-memory** automatically, so no DB is needed for the demo |
| **React 18 + Vite** | Dashboard | Fast dev server, component model |
| **Tailwind CSS** | Styling | Consistent dark glass design system |
| **Recharts** | Donut, area and bar charts | Declarative React charts |
| **pytest + httpx** | 50 unit, API and scenario tests | FastAPI TestClient |

## 🚀 Run it

**Backend** (from the project root):
```bash
pip install -r requirements.txt
```
```bash
uvicorn backend.main:app --reload
```
API: `http://localhost:8000` · Swagger: `http://localhost:8000/docs`

**Frontend:**
```bash
npm --prefix frontend install
```
```bash
npm run dev
```
Dashboard: `http://localhost:5173`. If the backend is not running, the UI still shows
labelled offline snapshots of the demo scenarios and tells you how to start the API.

## 🎬 Demo scenarios (Scenarios tab)
| Scenario | What happens |
|---|---|
| **Healthy Saver**: Priya, ₹60k income, 3 months | No false alarms (rent, SIP and the monthly BigBasket order are recognised as normal), health 100, *Aggressive* investment plan |
| **Fraud Detection**: same + ₹75,000 international charge | Flagged by **all 3 detectors** (136× typical); excluded from budget and forecast; Advisor leads with a security alert |
| **Budget Warning**: Rahul, ₹20k income, ~₹18.5k spent | Health 59, **High** risk; search expands 26 nodes and cuts Shopping/Food/Transport/Entertainment, never rent |
| **Lifestyle Creep**: Arjun, rising spend | Linear Regression (93% confidence) forecasts ₹63.8k on ₹70k income → **High** forecast risk |

Try the **Advisor** chat: *"Can I afford a 60k laptop?"*, *"How can I save on food?"*,
*"Is there anything suspicious?"*. Then open the **Agents** tab to see each agent's inputs,
outputs, timing and the messages they passed.

## 🔌 API
`POST /full_analysis` runs everything. There are also `/analyze_expenses`, `/create_budget`,
`/predict_expenses`, `/get_financial_advice`, `/investment_plan`, `/upload_transactions`,
`/upload_csv` (bank-statement CSV), `/classify`, `GET /model_info` and
`GET /get_transactions/{user_id}`. See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

## 🧪 Tests
```bash
pytest backend/tests/ -v
```
50 tests cover every agent, every endpoint, input validation, and all four demo scenarios
end-to-end. See [docs/TESTING_REPORT.md](docs/TESTING_REPORT.md).

## 📂 Structure
```
backend/
  agents/        coordinator, expense_analyzer, anomaly_detection, budget_planning,
                 prediction, investment, advisor
  services/      ml_service.py (NLP classifier), database.py (Mongo + in-memory fallback)
  routers/       transactions, budget, prediction, advice (+ shared deps)
  models/        Pydantic request/response models
  data/          classifier training set + hand-labelled hold-out set, sample data
  tests/         test_agents.py, test_api.py
frontend/src/
  components/    Dashboard, StatCards, ExpenseChart, AnomalyAlerts, BudgetPlan, Forecast,
                 InvestmentPlan, AdvisorPage, AskAdvisor, AgentPipeline, TransactionUpload, ...
  data/          scenarios.json (demo inputs), snapshots.json (offline fallback)
scripts/         generate_training_data.py, generate_snapshots.py
docs/            PEAS, architecture, algorithms, API, testing, team
```
After changing an agent, refresh the offline snapshots with `python scripts/generate_snapshots.py`.

## 📄 License
MIT
