from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class BudgetPlan(BaseModel):
    """Model for a generated budget plan."""
    recommended_budget: Dict[str, float] = Field(..., description="Category-wise budget limits")
    savings_target: float = Field(..., description="Recommended savings amount")
    budget_allocation: Dict[str, float] = Field(..., description="Needs, Wants, and Savings allocation")
    warnings: List[str] = Field(..., description="Over-budget category warnings")
    tips: List[str] = Field(..., description="Money saving tips")
    budget_health_score: float = Field(..., description="0-100 score indicating budget health")
