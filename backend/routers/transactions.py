import csv
import io
from datetime import datetime
from typing import List
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
try:
    from ..models.transaction import TransactionBatch
    from ..models.response import ExpenseAnalysisResponse
    from ..services.database import db_service
    from ..services.ml_service import ml_service
    from .deps import coordinator, batch_to_dicts
except (ImportError, ValueError):
    from models.transaction import TransactionBatch
    from models.response import ExpenseAnalysisResponse
    from services.database import db_service
    from services.ml_service import ml_service
    from routers.deps import coordinator, batch_to_dicts

router = APIRouter(prefix="", tags=["Transactions"])


@router.post("/upload_transactions")
async def upload_transactions(batch: TransactionBatch):
    """Accept a JSON batch of transactions, store them, return analysis."""
    transactions = batch_to_dicts(batch)
    analysis = coordinator.expense_agent.analyze_transactions(transactions, batch.monthly_income)
    await db_service.insert_transactions(batch.user_id, transactions)
    return {"message": "Transactions uploaded successfully", "count": len(transactions), "analysis": analysis}


@router.post("/upload_csv")
async def upload_csv(file: UploadFile = File(...), user_id: str = Form("demo_user"), monthly_income: float = Form(0)):
    """Upload a CSV with columns date,description,amount[,category]; stores and analyzes it."""
    text = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    required = {"date", "description", "amount"}
    if not reader.fieldnames or not required.issubset({f.strip().lower() for f in reader.fieldnames}):
        raise HTTPException(status_code=400, detail=f"CSV must have columns: {', '.join(sorted(required))}")

    transactions, errors = [], []
    for i, row in enumerate(reader, start=2):
        row = {k.strip().lower(): (v or "").strip() for k, v in row.items() if k}
        try:
            amount = float(row["amount"].replace(",", "").replace("₹", ""))
            if amount <= 0:
                raise ValueError("amount must be positive")
            date = datetime.fromisoformat(row["date"]).date().isoformat()
            if not row["description"]:
                raise ValueError("description is empty")
        except Exception as e:
            errors.append(f"Row {i}: {e}")
            continue
        transactions.append({"date": date, "description": row["description"], "amount": amount,
                             "category": row.get("category") or None, "user_id": user_id})

    analysis = coordinator.expense_agent.analyze_transactions(transactions, monthly_income)
    await db_service.insert_transactions(user_id, transactions)
    return {"message": f"Imported {len(transactions)} transactions", "count": len(transactions),
            "skipped_rows": errors, "transactions": transactions, "analysis": analysis}


@router.post("/analyze_expenses", response_model=ExpenseAnalysisResponse)
async def analyze_expenses(batch: TransactionBatch):
    """Accept transactions + income, return full expense analysis."""
    return coordinator.expense_agent.analyze_transactions(batch_to_dicts(batch), batch.monthly_income)


@router.post("/classify")
async def classify(descriptions: List[str]):
    """Classify raw transaction descriptions with the hybrid ML/NLP classifier."""
    return [{"description": d, **coordinator.expense_agent.classify(d)} for d in descriptions]


@router.get("/model_info")
async def model_info():
    """Training details and accuracy of the ML expense classifier."""
    ml_service.ensure_trained()
    return ml_service.info


@router.get("/get_transactions/{user_id}")
async def get_transactions(user_id: str):
    """Retrieve stored transactions."""
    transactions = await db_service.get_transactions(user_id)
    return {"user_id": user_id, "transactions": transactions}
