from fastapi import APIRouter
from typing import Dict, Any
from pydantic import BaseModel
try:
    from ..models.transaction import TransactionBatch
    from ..models.response import FullAnalysisResponse
    from ..agents.coordinator_agent import CoordinatorAgent
except (ImportError, ValueError):
    from models.transaction import TransactionBatch
    from models.response import FullAnalysisResponse
    from agents.coordinator_agent import CoordinatorAgent

router = APIRouter(prefix="", tags=["Advice"])
coordinator = CoordinatorAgent()

class AdviceRequest(BaseModel):
    batch: TransactionBatch
    user_query: str = None
    saving_goal: float = None

@router.post("/get_financial_advice")
async def get_financial_advice(req: AdviceRequest) -> Dict[str, Any]:
    """Accept full context, return NL advice."""
    transactions_dict = [
        {**t.model_dump(), 'date': t.date.isoformat()} for t in req.batch.transactions
    ]
    # Run full analysis to get context
    result = coordinator.process_user_request(
        transactions_dict, 
        req.batch.monthly_income, 
        req.user_query, 
        req.saving_goal
    )
    return result.get("advice", {})

@router.post("/full_analysis", response_model=FullAnalysisResponse)
async def full_analysis(req: AdviceRequest):
    """Master endpoint - runs all agents, returns everything."""
    transactions_dict = [
        {**t.model_dump(), 'date': t.date.isoformat()} for t in req.batch.transactions
    ]
    result = coordinator.process_user_request(
        transactions_dict, 
        req.batch.monthly_income, 
        req.user_query, 
        req.saving_goal
    )
    return result
