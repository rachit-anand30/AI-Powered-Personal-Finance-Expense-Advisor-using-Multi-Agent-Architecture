# 🧮 Algorithm Explanation

This document explains the core ML algorithms, statistical methods, and search strategies employed across the various agents.

## 1. Expense Categorization Algorithm
**Approach:** Keyword matching with Regular Expressions & Fuzzy Matching.
- **Why?** Given the predictable nature of merchant names (e.g., "Starbucks", "Uber"), a dictionary/keyword approach offers 100% explainability, zero cold-start problems, and ultra-low latency (<5ms per batch).
- **Process:** 
  1. Tokenize transaction description.
  2. Map tokens against exhaustive category dictionaries (Food, Transport, Utilities).
  3. Fallback to `Other` if unmapped.
- **Future Improvement:** Transition to a lightweight NLP/ML classification (like FastText or a small BERT model) to handle ambiguous merchant names dynamically.

## 2. Anomaly Detection Algorithms
To detect fraud or highly unusual spending, the system employs statistical methods.

### Z-Score Method
- **Mathematical Formula:** `Z = (X - μ) / σ`
- **Explanation:** Measures how many standard deviations a transaction `X` is from the historical mean `μ`. 
- **Threshold Selection:** A threshold of `Z > 2.5` is used, signifying the transaction is in the top ~1% of unusual amounts.
- **Pros:** Computationally trivial, highly interpretable.
- **Cons:** Assumes transaction amounts follow a normal (Gaussian) distribution, which is rarely perfectly true for finances.

### Isolation Forest
- **How it works:** An ensemble algorithm that isolates anomalies rather than profiling normal data. It recursively partitions the dataset randomly. Anomalies, being sparse and different, require fewer partitions to isolate.
- **Contamination Parameter:** Set to `0.05` (assuming 5% of inputs might be anomalous).
- **Pros:** Makes no assumptions about data distribution, handles multi-dimensional data well.
- **Cons:** Less interpretable to the end-user than a simple Z-score.
- **Strategy:** We combine both—using Z-Score for single-category spikes and Isolation Forest for multivariate anomaly patterns.

## 3. Budget Optimization Algorithm
### 50-30-20 Rule Formulation
- **Mathematics:** Needs (50%), Wants (30%), Savings (20%).
- **Budget Health Score:** `Score = 100 - (abs(Needs - 50) + abs(Wants - 30) + abs(Savings - 20))`
- **Optimization Strategy:**
  - Formulated as a **Constraint Satisfaction Problem (CSP)**.
  - **State:** Current % allocations.
  - **Goal:** Maximize Budget Health Score while satisfying constraints (e.g., Rent is fixed).
  - **Actions:** Recommend reducing variable "Wants" categories (Dining, Entertainment).
  - **Cost Function:** Lifestyle impact score (minimizing painful cuts).

## 4. Financial Prediction Algorithms
### Linear Regression
- **Formula:** `Y = mX + b`
- **Features:** Time (e.g., month number 1, 2, 3).
- **Target:** Monthly expense total.
- **When to Use:** Selected dynamically when the R² score of the historical data trend is high (>0.7), indicating a clear upward or downward spending trajectory.

### Moving Average
- **Formula:** `MA_n = (X_t + X_{t-1} + ... + X_{t-n+1}) / n`
- **Window:** 3-month trailing window.
- **When to Use:** Used when no clear linear trend exists (stable/oscillating spending).

## 5. Search Strategy for Financial Optimization
- **Problem Formulation:** AI Search Problem.
- **State Space:** All possible valid budget allocations.
- **Goal State:** User reaches monthly savings goal target.
- **Heuristic:** Euclidean distance from current savings rate to target savings rate.
- **Approach:** **Best-first search**. The agent explores budget adjustments by prioritizing the reduction of non-essential, high-cost categories first.
