import numpy as np
from typing import List, Dict, Any, Optional, Set
from datetime import datetime

try:
    from sklearn.linear_model import LinearRegression
    HAS_SKLEARN_LR = True
except (ImportError, Exception):
    HAS_SKLEARN_LR = False

class PredictionAgent:
    """Agent for predicting future expenses using statistical models."""

    def prepare_time_series_data(self, transactions: List[Dict[str, Any]]) -> Dict[str, float]:
        """Convert transaction list to monthly totals dictionary ordered by date."""
        if not transactions:
            return {}
            
        monthly_map = {}
        for t in transactions:
            d = t.get("date")
            if not d:
                continue
            if isinstance(d, str):
                month_str = d[:7]
            elif hasattr(d, "strftime"):
                month_str = d.strftime("%Y-%m")
            else:
                month_str = str(d)[:7]
            monthly_map[month_str] = monthly_map.get(month_str, 0.0) + float(t["amount"])
            
        sorted_keys = sorted(monthly_map.keys())
        return {k: monthly_map[k] for k in sorted_keys}

    def predict_linear_regression(self, y_values: List[float], months_ahead: int = 1) -> float:
        """Predict next month's expense using Linear Regression."""
        if len(y_values) < 2:
            return float(y_values[-1]) if len(y_values) > 0 else 0.0
            
        X = np.arange(len(y_values))
        y = np.array(y_values, dtype=float)
        
        if HAS_SKLEARN_LR:
            try:
                model = LinearRegression()
                model.fit(X.reshape(-1, 1), y)
                pred_x = np.array([[len(y_values) + months_ahead - 1]])
                pred = model.predict(pred_x)
                return max(0.0, float(pred[0]))
            except Exception:
                pass
                
        # Numpy polyfit fallback
        slope, intercept = np.polyfit(X, y, 1)
        pred_x_val = len(y_values) + months_ahead - 1
        pred_val = slope * pred_x_val + intercept
        return max(0.0, float(pred_val))

    def predict_moving_average(self, y_values: List[float], window: int = 3) -> float:
        """Predict next month's expense using Moving Average."""
        if not y_values:
            return 0.0
        if len(y_values) < window:
            return float(np.mean(y_values))
            
        return float(np.mean(y_values[-window:]))

    def calculate_savings_forecast(self, income: float, predicted_expense: float) -> float:
        """Forecast savings based on predicted expenses (negative means a shortfall)."""
        return income - predicted_expense

    def assess_financial_risk(self, predicted_expense: float, income: float) -> str:
        """Assess risk level based on predictions."""
        ratio = predicted_expense / income if income > 0 else 1.0
        if ratio > 0.9:
            return "High"
        elif ratio > 0.7:
            return "Medium"
        return "Low"

    @staticmethod
    def r_squared(y_values: List[float]) -> float:
        """Goodness of fit of a straight line through the monthly totals."""
        x = np.arange(len(y_values))
        y = np.array(y_values, dtype=float)
        slope, intercept = np.polyfit(x, y, 1)
        ss_res = float(np.sum((y - (slope * x + intercept)) ** 2))
        ss_tot = float(np.sum((y - y.mean()) ** 2))
        return 1.0 if ss_tot == 0 else max(0.0, 1 - ss_res / ss_tot)

    @staticmethod
    def next_month_label(last_month: str, months_ahead: int = 1) -> str:
        year, month = int(last_month[:4]), int(last_month[5:7])
        month += months_ahead
        year += (month - 1) // 12
        month = (month - 1) % 12 + 1
        return f"{year:04d}-{month:02d}"

    def predict_future_expenses(self, transactions: List[Dict[str, Any]], monthly_income: float, months_ahead: int = 1,
                                exclude_signatures: Optional[Set[str]] = None) -> Dict[str, Any]:
        """Generate comprehensive predictions.

        exclude_signatures lets the Anomaly agent tell this agent which one-off transactions
        should not distort the forecast. Investment transfers and refunds are ignored.
        """
        exclude_signatures = exclude_signatures or set()
        usable = [
            t for t in transactions
            if float(t.get("amount", 0)) > 0
            and t.get("category") != "Investments"
            and f"{t['date']}_{t['description']}_{t['amount']}" not in exclude_signatures
        ]
        excluded_amount = sum(float(t["amount"]) for t in transactions
                              if f"{t['date']}_{t['description']}_{t['amount']}" in exclude_signatures)
        if not usable:
            return {
                "prediction_method": "None",
                "predicted_expense": 0.0,
                "predicted_savings": monthly_income,
                "risk_level": "Low",
                "confidence": 0.0,
                "trend_direction": "Stable",
                "monthly_history": [],
                "next_month": None,
                "excluded_one_offs": excluded_amount,
            }

        monthly_dict = self.prepare_time_series_data(usable)
        y_values = list(monthly_dict.values())

        # Decide which method to use based on data size
        if len(y_values) >= 3:
            method = "Linear Regression"
            predicted_exp = self.predict_linear_regression(y_values, months_ahead)
            # Confidence grows with fit quality (R^2) and with the amount of history
            confidence = min(95.0, 45 + 40 * self.r_squared(y_values) + 2 * len(y_values))
        else:
            method = "Moving Average"
            predicted_exp = self.predict_moving_average(y_values, min(len(y_values), 3))
            confidence = 40.0 + 15 * len(y_values)

        savings = self.calculate_savings_forecast(monthly_income, predicted_exp)
        risk = self.assess_financial_risk(predicted_exp, monthly_income)

        # Trend
        if len(y_values) >= 2:
            last_val, prev_val = y_values[-1], y_values[-2]
            if last_val > prev_val * 1.05:
                trend = "Increasing"
            elif last_val < prev_val * 0.95:
                trend = "Decreasing"
            else:
                trend = "Stable"
        else:
            trend = "Stable"

        history = [{"month": month_key, "amount": float(val)} for month_key, val in monthly_dict.items()]

        return {
            "prediction_method": method,
            "predicted_expense": round(predicted_exp, 2),
            "predicted_savings": round(savings, 2),
            "risk_level": risk,
            "confidence": round(confidence, 1),
            "trend_direction": trend,
            "monthly_history": history,
            "next_month": self.next_month_label(history[-1]["month"], months_ahead),
            "excluded_one_offs": excluded_amount,
        }
