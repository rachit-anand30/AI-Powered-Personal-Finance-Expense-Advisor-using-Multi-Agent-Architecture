from typing import Optional
from fastapi import APIRouter
try:
    from ..models.transaction import TransactionBatch
    from ..models.budget import BudgetPlan
    from .deps import coordinator, batch_to_dicts
except (ImportError, ValueError):
    from models.transaction import TransactionBatch
    from models.budget import BudgetPlan
    from routers.deps import coordinator, batch_to_dicts

router = APIRouter(prefix="", tags=["Budget"])


@router.post("/create_budget", response_model=BudgetPlan)
async def create_budget(batch: TransactionBatch, saving_goal: Optional[float] = None):
    """Accept income + transactions, return budget plan."""
    expense_analysis = coordinator.expense_agent.analyze_transactions(batch_to_dicts(batch), batch.monthly_income)
    return coordinator.budget_agent.create_budget(batch.monthly_income, expense_analysis, saving_goal)
