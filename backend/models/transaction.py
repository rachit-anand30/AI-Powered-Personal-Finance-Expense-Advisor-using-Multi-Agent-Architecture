from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date as dt_date

class Transaction(BaseModel):
    """Model representing a single financial transaction."""
    date: dt_date = Field(..., description="Date of the transaction")
    description: str = Field(..., min_length=1, description="Description or merchant name")
    amount: float = Field(..., gt=0, description="Transaction amount in INR (must be positive)")
    category: Optional[str] = Field(default=None, description="User-provided category; inferred by the ML classifier when omitted")
    user_id: Optional[str] = Field(default=None, description="ID of the user who made the transaction (defaults to the batch user_id)")

class TransactionBatch(BaseModel):
    """Model for uploading a batch of transactions."""
    user_id: str = Field(..., description="User ID for the batch")
    monthly_income: float = Field(..., ge=0, description="User's monthly income in INR")
    transactions: List[Transaction] = Field(..., description="List of transactions")

class UserProfile(BaseModel):
    """Model representing a user profile."""
    user_id: str = Field(..., description="Unique user identifier")
    name: str = Field(..., description="User's full name")
    monthly_income: float = Field(..., description="Monthly income in INR")
    saving_goal: Optional[float] = Field(default=None, description="Target savings amount per month")
