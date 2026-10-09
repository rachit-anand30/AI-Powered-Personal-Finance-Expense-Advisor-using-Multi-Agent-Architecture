"""Shared dependencies for all routers: one coordinator (and its agents) for the whole app."""
from typing import List, Dict, Any
try:
    from ..agents.coordinator_agent import CoordinatorAgent
    from ..models.transaction import TransactionBatch
except (ImportError, ValueError):
    from agents.coordinator_agent import CoordinatorAgent
    from models.transaction import TransactionBatch

coordinator = CoordinatorAgent()


def batch_to_dicts(batch: TransactionBatch) -> List[Dict[str, Any]]:
    """Serialise a validated batch into plain dicts (ISO dates, batch user_id filled in)."""
    return [
        {**t.model_dump(), "date": t.date.isoformat(), "user_id": t.user_id or batch.user_id}
        for t in batch.transactions
    ]
