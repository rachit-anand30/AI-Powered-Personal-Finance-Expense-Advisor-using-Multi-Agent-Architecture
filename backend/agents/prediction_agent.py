import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np
from typing import List, Dict, Any
from datetime import datetime

class PredictionAgent:
    """Agent for predicting future expenses using statistical models."""

    def prepare_time_series_data(self, transactions: List[Dict[str, Any]]) -> pd.Series:
        """Convert transaction list to monthly totals."""
        if not transactions:
            return pd.Series(dtype=float)
            
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        # Group by Year-Month and sum amount
        monthly = df.groupby(df['date'].dt.to_period('M'))['amount'].sum()
        return monthly

    def predict_linear_regression(self, monthly_data: pd.Series, months_ahead: int = 1) -> float:
        """Predict next month's expense using Linear Regression."""
        if len(monthly_data) < 2:
            return float(monthly_data.iloc[-1]) if not monthly_data.empty else 0.0
            
        X = np.arange(len(monthly_data)).reshape(-1, 1)
        y = monthly_data.values
        
        model = LinearRegression()
        model.fit(X, y)
        
        pred_x = np.array([[len(monthly_data) + months_ahead - 1]])
        pred = model.predict(pred_x)
        return max(0.0, float(pred[0]))

    def predict_moving_average(self, monthly_data: pd.Series, window: int = 3) -> float:
        """Predict next month's expense using Moving Average."""
        if len(monthly_data) == 0:
            return 0.0
        if len(monthly_data) < window:
            return float(monthly_data.mean())
            
        return float(monthly_data.rolling(window=window).mean().iloc[-1])

    def calculate_savings_forecast(self, income: float, predicted_expense: float) -> float:
        """Forecast savings based on predicted expenses."""
        return max(0.0, income - predicted_expense)

    def assess_financial_risk(self, predicted_expense: float, income: float) -> str:
        """Assess risk level based on predictions."""
        ratio = predicted_expense / income if income > 0 else 1.0
        if ratio > 0.9:
            return "High"
        elif ratio > 0.7:
            return "Medium"
        return "Low"

    def predict_future_expenses(self, transactions: List[Dict[str, Any]], monthly_income: float, months_ahead: int = 1) -> Dict[str, Any]:
        """Generate comprehensive predictions."""
        if not transactions:
             return {
                "prediction_method": "None",
                "predicted_expense": 0.0,
                "predicted_savings": monthly_income,
                "risk_level": "Low",
                "confidence": 0.0,
                "trend_direction": "Stable",
                "monthly_history": []
            }

        monthly_data = self.prepare_time_series_data(transactions)
        
        # Decide which method to use based on data size
        if len(monthly_data) >= 3:
            method = "Linear Regression"
            predicted_exp = self.predict_linear_regression(monthly_data, months_ahead)
            confidence = 85.0
        else:
            method = "Moving Average"
            predicted_exp = self.predict_moving_average(monthly_data, min(len(monthly_data), 3))
            confidence = 60.0

        savings = self.calculate_savings_forecast(monthly_income, predicted_exp)
        risk = self.assess_financial_risk(predicted_exp, monthly_income)
        
        # Trend
        if len(monthly_data) >= 2:
            last_val = monthly_data.iloc[-1]
            prev_val = monthly_data.iloc[-2]
            if last_val > prev_val * 1.05: trend = "Increasing"
            elif last_val < prev_val * 0.95: trend = "Decreasing"
            else: trend = "Stable"
        else:
            trend = "Stable"
            
        history = [{"month": str(idx), "amount": float(val)} for idx, val in monthly_data.items()]

        return {
            "prediction_method": method,
            "predicted_expense": round(predicted_exp, 2),
            "predicted_savings": round(savings, 2),
            "risk_level": risk,
            "confidence": confidence,
            "trend_direction": trend,
            "monthly_history": history
        }
