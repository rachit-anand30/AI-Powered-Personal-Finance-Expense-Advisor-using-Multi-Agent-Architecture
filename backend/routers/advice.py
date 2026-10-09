from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
try:
    from ..models.transaction import TransactionBatch
    from ..models.response import FullAnalysisResponse
    from .deps import coordinator, batch_to_dicts
except (ImportError, ValueError):
    from models.transaction import TransactionBatch
    from models.response import FullAnalysisResponse
    from routers.deps import coordinator, batch_to_dicts

router = APIRouter(prefix="", tags=["Advice"])


class AdviceRequest(BaseModel):
    batch: TransactionBatch
    user_query: Optional[str] = Field(default=None, description="Natural-language question for the Advisor agent")
    saving_goal: Optional[float] = Field(default=None, ge=0, description="Monthly savings goal in INR")
    include_one_offs: bool = Field(default=False, description="Let flagged one-off purchases shape the spending forecast")


def run_pipeline(req: AdviceRequest) -> Dict[str, Any]:
    result = coordinator.process_user_request(batch_to_dicts(req.batch), req.batch.monthly_income, req.user_query,
                                              req.saving_goal, req.include_one_offs)
    if "error" in result:
        raise HTTPException(status_code=500, detail={"error": result["error"], "logs": result["logs"]})
    return result


@router.post("/get_financial_advice")
async def get_financial_advice(req: AdviceRequest) -> Dict[str, Any]:
    """Run all agents and return the Advisor's natural-language advice (and answer to user_query)."""
    return run_pipeline(req)["advice"]


@router.post("/investment_plan")
async def investment_plan(req: AdviceRequest) -> Dict[str, Any]:
    """Run all agents and return the Investment agent's plan for the monthly surplus."""
    return run_pipeline(req)["investment_plan"]


@router.post("/full_analysis", response_model=FullAnalysisResponse)
async def full_analysis(req: AdviceRequest):
    """Master endpoint - runs all six agents through the coordinator and returns everything."""
    return run_pipeline(req)
