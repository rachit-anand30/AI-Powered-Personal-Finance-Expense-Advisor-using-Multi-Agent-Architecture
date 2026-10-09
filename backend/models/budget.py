from pydantic import BaseModel, Field
from typing import Dict, List, Any

class BudgetPlan(BaseModel):
    """Model for a generated budget plan."""
    recommended_budget: Dict[str, float] = Field(..., description="Category-wise monthly limits found by the cut-optimisation search")
    savings_target: float = Field(..., description="Recommended savings amount")
    budget_allocation: Dict[str, float] = Field(..., description="Needs, Wants, and Savings allocation (50/30/20)")
    actual_allocation: Dict[str, float] = Field(..., description="Current monthly Needs, Wants and Savings")
    savings_rate: float = Field(..., description="Percentage of income currently saved")
    warnings: List[str] = Field(..., description="Over-budget warnings, most serious first")
    tips: List[str] = Field(..., description="Money saving tips targeted at the worst categories")
    budget_health_score: float = Field(..., description="0-100 score indicating budget health")
    risk_level: str = Field(..., description="Low / Medium / High")
    optimization: Dict[str, Any] = Field(..., description="Result of the greedy best-first cut search")
    baseline_savings: float = Field(..., description="Monthly savings if flagged one-off charges are refunded")
    flagged_amount: float = Field(0.0, description="Flagged spending included in actual figures but not used for cuts")
    monthly_scores: List[Dict[str, Any]] = Field(default_factory=list, description="Health score and savings for each calendar month")
