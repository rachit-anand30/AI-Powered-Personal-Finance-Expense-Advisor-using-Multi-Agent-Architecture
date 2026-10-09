# 🤝 Team Responsibilities

## 🧑‍💻 Adithya Nambiar (Team Member 1): Financial data intelligence
| Component | Files |
|---|---|
| Expense Analyzer agent (hybrid ML + rules) | `backend/agents/expense_analyzer_agent.py` |
| ML/NLP classifier and training data | `backend/services/ml_service.py`, `scripts/generate_training_data.py`, `backend/data/training_transactions.csv`, `backend/data/classifier_test_set.csv` |
| Anomaly Detection agent (3-detector ensemble) | `backend/agents/anomaly_detection_agent.py` |
| PEAS documentation | `docs/PEAS_FORMULATION.md` |

- **Presents:** PEAS, environment analysis, ML classification (94% hold-out), fraud detection.
- **Demos:** Healthy Saver and Fraud Detection scenarios, Transactions tab (ML labels).

## 🧑‍💻 Rachit Anand (Team Member 2): Budget optimisation and prediction
| Component | Files |
|---|---|
| Budget Planning agent (50/30/20 + greedy best-first search) | `backend/agents/budget_planning_agent.py` |
| Prediction agent (Linear Regression / Moving Average) | `backend/agents/prediction_agent.py` |
| Algorithm documentation and tests | `docs/ALGORITHM_EXPLANATION.md`, `backend/tests/test_agents.py` |

- **Presents:** search problem formulation, health score, regression and confidence.
- **Demos:** Budget Warning and Lifestyle Creep scenarios, Budget and Forecast tabs.

## 🧑‍💻 Rohith Abhinav (Team Member 3): Coordinator, Investment, Advisor and application
| Component | Files |
|---|---|
| Coordinator agent (blackboard, trace, message bus) | `backend/agents/coordinator_agent.py` |
| Investment agent | `backend/agents/investment_agent.py` |
| Advisor agent (intent detection, NLG) | `backend/agents/advisor_agent.py` |
| FastAPI API, models, storage | `backend/main.py`, `backend/routers/`, `backend/models/`, `backend/services/database.py` |
| React dashboard | `frontend/src/` |
| Architecture docs, API tests | `docs/AGENT_ARCHITECTURE.md`, `docs/API_DOCUMENTATION.md`, `backend/tests/test_api.py` |

- **Presents:** multi-agent architecture and interactions, tool stack, UI.
- **Demos:** Agents tab (trace + message bus), Ask-the-advisor chat, Invest tab, offline fallback.

## ⚖️ Balance
Each member owns two agents and one documentation area. The interfaces between agents are plain
dictionaries on the coordinator's blackboard, so each member's agents are unit-tested independently.
