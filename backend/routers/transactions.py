from fastapi import APIRouter, HTTPException
from typing import List
from ..models.transaction import TransactionBatch, Transaction
from ..models.response import ExpenseAnalysisResponse
from ..services.database import db_service
from ..agents.coordinator_agent import CoordinatorAgent

router = APIRouter(prefix="", tags=["Transactions"])
coordinator = CoordinatorAgent()

@router.post("/upload_transactions")
async def upload_transactions(batch: TransactionBatch):
    """Accept list of transactions, store them, return analysis."""
    # Serialize dates for the agent
    transactions_dict = []
    for t in batch.transactions:
        d = t.model_dump()
        d['date'] = d['date'].isoformat()
        transactions_dict.append(d)
        
    # Store
    await db_service.insert_transactions(batch.user_id, transactions_dict)
    
    # Analyze
    analysis = coordinator.expense_agent.analyze_transactions(transactions_dict)
    return {"message": "Transactions uploaded successfully", "analysis": analysis}

@router.post("/analyze_expenses", response_model=ExpenseAnalysisResponse)
async def analyze_expenses(batch: TransactionBatch):
    """Accept transactions + income, return full expense analysis."""
    transactions_dict = [
        {**t.model_dump(), 'date': t.date.isoformat()} for t in batch.transactions
    ]
    analysis = coordinator.expense_agent.analyze_transactions(transactions_dict)
    return analysis

@router.get("/get_transactions/{user_id}")
async def get_transactions(user_id: str):
    """Retrieve stored transactions."""
    transactions = await db_service.get_transactions(user_id)
    return {"user_id": user_id, "transactions": transactions}
