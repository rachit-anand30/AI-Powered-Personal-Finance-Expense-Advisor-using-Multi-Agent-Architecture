from fastapi import APIRouter
from typing import Dict, Any
try:
    from ..models.transaction import TransactionBatch
    from ..agents.coordinator_agent import CoordinatorAgent
except (ImportError, ValueError):
    from models.transaction import TransactionBatch
    from agents.coordinator_agent import CoordinatorAgent

router = APIRouter(prefix="", tags=["Prediction"])
coordinator = CoordinatorAgent()

@router.post("/predict_expenses")
async def predict_expenses(batch: TransactionBatch) -> Dict[str, Any]:
    """Accept transactions + income, return predictions."""
    transactions_dict = [
        {**t.model_dump(), 'date': t.date.isoformat()} for t in batch.transactions
    ]
    predictions = coordinator.prediction_agent.predict_future_expenses(transactions_dict, batch.monthly_income)
    return predictions
