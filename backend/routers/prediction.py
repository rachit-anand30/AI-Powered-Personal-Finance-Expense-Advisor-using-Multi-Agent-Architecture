from fastapi import APIRouter
from typing import Dict, Any
try:
    from ..models.transaction import TransactionBatch
    from .deps import coordinator, batch_to_dicts
except (ImportError, ValueError):
    from models.transaction import TransactionBatch
    from routers.deps import coordinator, batch_to_dicts

router = APIRouter(prefix="", tags=["Prediction"])


@router.post("/predict_expenses")
async def predict_expenses(batch: TransactionBatch) -> Dict[str, Any]:
    """Accept transactions + income, return predictions (one-off anomalies excluded)."""
    transactions = batch_to_dicts(batch)
    coordinator.expense_agent.analyze_transactions(transactions, batch.monthly_income)  # labels categories
    anomalies = coordinator.anomaly_agent.detect_all_anomalies(transactions, batch.monthly_income)
    exclude = {coordinator._signature(a) for a in anomalies["flagged_transactions"]}
    return coordinator.prediction_agent.predict_future_expenses(transactions, batch.monthly_income, exclude_signatures=exclude)
