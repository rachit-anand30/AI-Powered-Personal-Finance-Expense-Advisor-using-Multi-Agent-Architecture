from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

class Transaction(BaseModel):
    """Model representing a single financial transaction."""
    date: date = Field(..., description="Date of the transaction")
    description: str = Field(..., description="Description or merchant name")
    amount: float = Field(..., description="Transaction amount in INR")
    category: Optional[str] = Field(default=None, description="Inferred or user-provided category")
    user_id: str = Field(..., description="ID of the user who made the transaction")

class TransactionBatch(BaseModel):
    """Model for uploading a batch of transactions."""
    user_id: str = Field(..., description="User ID for the batch")
    monthly_income: float = Field(..., description="User's monthly income in INR")
    transactions: List[Transaction] = Field(..., description="List of transactions")

class UserProfile(BaseModel):
    """Model representing a user profile."""
    user_id: str = Field(..., description="Unique user identifier")
    name: str = Field(..., description="User's full name")
    monthly_income: float = Field(..., description="Monthly income in INR")
    saving_goal: Optional[float] = Field(default=None, description="Target savings amount per month")
