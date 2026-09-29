from fastapi import APIRouter
from ..models.transaction import TransactionBatch
from ..models.budget import BudgetPlan
from ..agents.coordinator_agent import CoordinatorAgent

router = APIRouter(prefix="", tags=["Budget"])
coordinator = CoordinatorAgent()

@router.post("/create_budget", response_model=BudgetPlan)
async def create_budget(batch: TransactionBatch):
    """Accept income + transactions, return budget plan."""
    transactions_dict = [
        {**t.model_dump(), 'date': t.date.isoformat()} for t in batch.transactions
    ]
    expense_analysis = coordinator.expense_agent.analyze_transactions(transactions_dict)
    budget_plan = coordinator.budget_agent.create_budget(batch.monthly_income, expense_analysis)
    return budget_plan
