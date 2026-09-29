# 🏗️ Multi-Agent Architecture

## 1. System Overview
The system employs a **Multi-Agent AI Architecture** to handle personal finance. 
**Why Multi-Agent vs. Single Agent?**
Personal finance requires a diverse set of skills (categorization, anomaly detection, forecasting, and NLP advising). A monolithic single agent would be computationally heavy and prone to cross-contamination of logic. A multi-agent system provides modularity, specialized optimization (e.g., ML forecasting vs. Keyword-based matching), and high scalability.

**Agent Autonomy Levels:**
- Reactive (Analyzer, Anomaly Detector): Operates directly on immediate input data.
- Deliberative (Budget Planner, Advisor): Makes forward-looking decisions based on states and goals.

## 2. Architecture Diagram

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

## 3. Agent Communication Protocol
Agents communicate via a centralized **Hub-and-Spoke model** managed by the Coordinator Agent using asynchronous JSON message passing. 

**Message Schema Example:**
```json
{
  "sender": "CoordinatorAgent",
  "recipient": "AnomalyDetector",
  "action": "ANALYZE_TRANSACTIONS",
  "payload": [{ "id": 1, "amount": 75000, "category": "Shopping" }],
  "timestamp": "2023-10-25T14:30:00Z"
}
```

## 4. Agent Interaction Scenarios

### Normal Analysis Flow
1. API receives transactions.
2. Coordinator sends to `Expense Analyzer`.
3. Analyzer returns categorized data to Coordinator.
4. Coordinator passes this to `Budget Planner`.
5. Planner generates optimization report.
6. Coordinator returns aggregated result to user.

### Fraud Detection Flow
1. Real-time transaction arrives.
2. Coordinator pushes strictly to `Anomaly Detector`.
3. Detector flags `amount > 3 stdev`.
4. Coordinator interrupts normal flow, triggering push notification.

### Budget Creation Flow
1. User provides income and savings goal.
2. `Expense Analyzer` calculates past averages.
3. `Budget Planner` executes Constraint Satisfaction to generate limits.
4. `Advisor Agent` translates limits into readable advice.

### Prediction Flow
1. Coordinator requests next month's forecast.
2. `Predict Agent` runs Linear Regression/MA on past 6 months.
3. `Advisor Agent` interprets trends (e.g., "Your utilities are trending up").

## 5. Agent Types Classification
- **Reactive Agents:** Expense Analyzer, Anomaly Detector. They respond immediately to stimuli without internal long-term state.
- **Deliberative Agents:** Budget Planner, Predictor. These utilize **BDI (Belief-Desire-Intention)** models.
  - *Belief:* Current financial state.
  - *Desire:* Maximize savings.
  - *Intention:* Formulate action plan (budget cuts).
- **Cooperation Level:** High (Collaborative). Agents share a global utility function (User Financial Health).

## 6. Environment Analysis
- **Partially Observable:** The system doesn't know about physical cash or hidden accounts.
- **Dynamic:** Income, inflation, and expenses change.
- **Continuous:** Money and time flow continuously, though categorized discreetly.
- **Multi-Agent:** Collaborative agent network.
- **Stochastic:** Random financial emergencies break deterministic patterns.
