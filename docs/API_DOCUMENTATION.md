# 🌐 API Documentation

This document describes the REST API endpoints exposed by the FastAPI server to interface with the Multi-Agent System.

---

### 1. GET `/`
- **Description:** Health check endpoint to verify API status.
- **Request Body:** None
- **Response:**
  ```json
  {
    "status": "online",
    "message": "AI Financial Advisor API is running"
  }
  ```

---

### 2. POST `/upload_transactions`
- **Description:** Upload raw transaction data to the system.
- **Request Body:** List of transaction objects.
  ```json
  {
    "user_id": "user_123",
    "transactions": [
      { "date": "2023-10-01", "description": "Starbucks", "amount": 250 }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "records_inserted": 1
  }
  ```

---

### 3. POST `/analyze_expenses`
- **Description:** Triggers the Expense Analyzer Agent.
- **Request Body:** `{ "user_id": "user_123", "month": "10-2023" }`
- **Response:**
  ```json
  {
    "total_expenses": 250,
    "categories": { "Food & Dining": 250 },
    "accuracy_score": 0.98
  }
  ```

---

### 4. POST `/create_budget`
- **Description:** Triggers the Budget Planner Agent.
- **Request Body:** `{ "user_id": "user_123", "monthly_income": 50000, "savings_goal": 10000 }`
- **Response:**
  ```json
  {
    "allocations": { "Needs": 25000, "Wants": 15000, "Savings": 10000 },
    "health_score": 85,
    "warnings": []
  }
  ```

---

### 5. POST `/predict_expenses`
- **Description:** Triggers the Prediction Agent to forecast next month's spending.
- **Request Body:** `{ "user_id": "user_123", "target_month": "11-2023" }`
- **Response:**
  ```json
  {
    "predicted_total": 34000,
    "confidence_interval": "+/- 2000",
    "trend": "increasing"
  }
  ```

---

### 6. POST `/get_financial_advice`
- **Description:** Triggers the Advisor Agent to generate NLP insights.
- **Request Body:** `{ "user_id": "user_123" }`
- **Response:**
  ```json
  {
    "advice": "Your dining expenses are 15% higher this month. Consider reducing weekend restaurant visits to hit your ₹10000 savings goal."
  }
  ```

---

### 7. POST `/full_analysis`
- **Description:** Master endpoint that invokes the Coordinator Agent to run the entire multi-agent pipeline.
- **Request Body:** `{ "user_id": "user_123", "monthly_income": 50000 }`
- **Response:**
  ```json
  {
    "analysis": { /* payload from /analyze_expenses */ },
    "anomalies": [ /* flagged high-risk items */ ],
    "budget": { /* payload from /create_budget */ },
    "prediction": { /* payload from /predict_expenses */ },
    "advice": "..."
  }
  ```

---

### 8. GET `/get_transactions/{user_id}`
- **Description:** Retrieve historical transactions for a user.
- **Request Body:** None
- **Response:**
  ```json
  {
    "transactions": [
      { "date": "...", "description": "...", "amount": 250, "category": "Food" }
    ]
  }
  ```

---

## 🚫 Error Codes
- **422 Unprocessable Entity:** Missing or malformed JSON body fields.
- **404 Not Found:** `user_id` does not exist in the database.
- **500 Internal Server Error:** Multi-agent pipeline failure (e.g., Coordinator timeout).
