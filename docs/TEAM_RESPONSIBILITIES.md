# 🤝 Team Responsibilities

This document outlines the breakdown of roles, system components, and presentation responsibilities across the three team members.

## Team Member Breakdown

### 🧑‍💻 Team Member 1: Financial Data Intelligence
| Component | Description | Files Modified/Created | Status |
|-----------|-------------|------------------------|--------|
| **Expense Analyzer Agent** | Keyword/ML based categorization logic | `agents/analyzer.py` | Complete |
| **Anomaly Detection Agent** | Statistical outlier detection (Z-score, IF) | `agents/anomaly.py` | Complete |
| **Dataset Engine** | Creation of realistic financial test data | `data/generator.py` | Complete |
| **PEAS Documentation** | System and Agent environment models | `docs/PEAS_FORMULATION.md` | Complete |

- **Presentation Responsibility:** Slides 1-7 (Intro, Data Intelligence, PEAS).
- **Demo Responsibility:** Scenario 1 (Analysis) & Scenario 3 (Fraud Detection).

---

### 🧑‍💻 Team Member 2: Budget Optimization & Prediction
| Component | Description | Files Modified/Created | Status |
|-----------|-------------|------------------------|--------|
| **Budget Planning Agent** | 50/30/20 optimizer and CSP search solver | `agents/budget.py` | Complete |
| **Prediction Agent** | Time-series forecasting (LR & Moving Avg) | `agents/predict.py` | Complete |
| **Algorithm Docs** | Mathematical formulas and ML explanations | `docs/ALGORITHM_EXPLANATION.md`| Complete |
| **Testing Implementation** | Pytest cases for calculation logic | `tests/test_agents.py` | Complete |

- **Presentation Responsibility:** Slides 8-14 (Algorithms, Predictions, Budgets).
- **Demo Responsibility:** Scenario 2 (Budget Creation) & Scenario 4 (Forecasting).

---

### 🧑‍💻 Team Member 3: Multi-Agent Coordinator + Application
| Component | Description | Files Modified/Created | Status |
|-----------|-------------|------------------------|--------|
| **Coordinator Agent** | Multi-agent orchestration and routing | `agents/coordinator.py` | Complete |
| **Advisor Agent** | NLP-based advice generation from agent data | `agents/advisor.py` | Complete |
| **API & Frontend** | FastAPI server and React dashboard UI | `main.py`, `src/App.js` | Complete |
| **Architecture Docs** | System flow and network diagrams | `docs/AGENT_ARCHITECTURE.md` | Complete |

- **Presentation Responsibility:** Slides 15-20 (Architecture, UI, Full Pipeline).
- **Demo Responsibility:** End-to-End System Demo and API Walkthrough.

---

## ⚖️ Workload Balance Analysis

The project was structured to ensure equitable distribution of complexity and effort:

- **Lines of Code:** Each member is responsible for approximately 600-800 lines of core Python/JavaScript code.
- **AI Components:** Each member owns exactly TWO specialized AI agents.
- **Documentation:** Responsibilities were split based on domain expertise (e.g., TM1 handles PEAS, TM2 handles Math/Algorithms, TM3 handles overall Architecture).
- **Integration:** While TM3 handles the web layer, TM1 and TM2 were responsible for writing strictly typed, easily integrated Pydantic interfaces for their respective agents.
