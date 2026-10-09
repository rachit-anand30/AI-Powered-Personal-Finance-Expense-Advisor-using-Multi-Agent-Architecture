from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class ExpenseAnalysisResponse(BaseModel):
    """Response model for expense analysis."""
    category_wise_spending: Dict[str, float]
    monthly_total: float
    total_spending: float
    months_covered: int
    investments_total: float
    daily_average: float
    spending_percentages: Dict[str, float]
    highest_expense_category: Optional[str] = None
    overspending_alerts: List[str]
    trends: Dict[str, Any]
    savings_rate: Optional[float] = None
    risk_level: str

class FullAnalysisResponse(BaseModel):
    """Comprehensive analysis response combining all agents."""
    expense_analysis: Dict[str, Any]
    anomalies: Dict[str, Any]
    budget_plan: Dict[str, Any]
    predictions: Dict[str, Any]
    investment_plan: Dict[str, Any]
    advice: Dict[str, Any]
    categorized_transactions: List[Dict[str, Any]]
    logs: List[str]
    trace: List[Dict[str, Any]]
    messages: List[Dict[str, Any]]
