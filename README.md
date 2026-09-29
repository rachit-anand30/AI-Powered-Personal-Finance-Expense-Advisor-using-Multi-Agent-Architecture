# 🌟 AI-Powered Personal Finance & Expense Advisor

![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python) ![React](https://img.shields.io/badge/React-18-blue?logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100-green?logo=fastapi) ![AI](https://img.shields.io/badge/AI-Powered-purple)

## 📌 Project Overview
The **AI-Powered Personal Finance & Expense Advisor** is a state-of- natural language processing and multi-agent system designed to help users intelligently manage their finances. By employing multiple specialized AI agents, the system automates expense categorization, detects fraudulent transactions, optimizes budget allocations, predicts future expenses, and provides personalized financial advice.

## 🏗️ Architecture Diagram

```text
┌─────────────────────────────────────────────────────┐
│               USER INTERFACE                        │
│  (React Dashboard + Transaction Input)              │
└─────────────────────┬───────────────────────────────┘
                      │
               FastAPI REST API
                      │
           ┌──────────┴──────────┐
           │  COORDINATOR AGENT  │ (Team Member 3)
           │  (Central Hub)      │
           └──────┬───┬───┬──────┘
                  │   │   │
     ┌────────────┼── │ ──┼────────────┐
     │            │   │   │            │
┌────┴───┐ ┌──────┴┐ ┌┴──────┐ ┌───────┴┐ ┌────────┐
│Expense │ │Anomaly│ │Budget │ │Predict │ │Advisor │
│Analyzer│ │Detect │ │Planner│ │Agent   │ │Agent   │
│(TM1)   │ │(TM1)  │ │(TM2)  │ │(TM2)   │ │(TM3)   │
└────────┘ └───────┘ └───────┘ └────────┘ └────────┘
```

## 👥 Team Responsibilities
| Team Member | Role / Agents | Focus Area |
|-------------|---------------|------------|
| **Team Member 1** | Expense Analyzer & Anomaly Detect | Financial Data Intelligence, Security |
| **Team Member 2** | Budget Planner & Predict Agent | Optimization, ML Modeling, Forecasting |
| **Team Member 3** | Coordinator, Advisor, API, UI | Orchestration, Integration, User Experience |

## 🛠️ Tech Stack
| Component | Technology | Description |
|-----------|------------|-------------|
| **Backend** | Python, FastAPI | High-performance async API |
| **Frontend** | React.js, TailwindCSS | Dynamic interactive dashboard |
| **AI/ML** | Scikit-learn, Pandas | Algorithms and data manipulation |
| **Agents** | Custom Python Classes | Multi-agent framework |

## 🚀 Installation Instructions

### Backend Setup
```bash
# Navigate to backend directory
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
*Alternatively from project root: `uvicorn backend.main:app --reload`*
*Server runs on `http://localhost:8000`*

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend
npm install
npm run dev
```
*Alternatively from project root: `npm run dev`*
*Dashboard runs on `http://localhost:5173` (or `http://localhost:3000`)*

## 🔌 API Endpoint List
- `GET /` - API Health check
- `POST /upload_transactions` - Upload CSV of transactions
- `POST /analyze_expenses` - Categorize and summarize expenses
- `POST /create_budget` - Generate optimized budget plan
- `POST /predict_expenses` - Forecast future spending
- `POST /get_financial_advice` - Get NLP-based advisor insights
- `POST /full_analysis` - Trigger end-to-end multi-agent pipeline
- `GET /get_transactions/{user_id}` - Retrieve user transaction history

## 🎬 Demo Scenarios
1. **Normal Analysis Flow:** User uploads standard monthly transactions; system categorizes them and generates a 50-30-20 budget.
2. **Fraud Detection Flow:** A single ₹75,000 transaction is injected into otherwise normal data; the Anomaly Agent flags it immediately.
3. **Budget Warning Flow:** Income is ₹20,000 but expenses are ₹18,500; the system warns of high risk and provides actionable cuts.
4. **Prediction Flow:** 3 months of historical data provided; the Predict Agent accurately forecasts month 4's expected costs.

## 🧪 How to Run Tests
```bash
# From the project root directory
pytest backend/tests/ -v
```

## 📂 File Structure
```
project_root/
├── backend/
│   ├── main.py
│   ├── agents/
│   └── models/
├── frontend/
│   ├── src/
│   └── package.json
├── docs/
│   ├── PEAS_FORMULATION.md
│   └── ...
├── tests/
├── requirements.txt
└── README.md
```

## 📸 Screenshots
*(Placeholder for UI Dashboard Screenshots - e.g., spending charts, budget breakdown, alert notifications)*

## 📄 License
MIT License.
