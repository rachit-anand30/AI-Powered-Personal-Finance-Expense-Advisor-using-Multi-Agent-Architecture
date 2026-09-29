from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Any
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class DatabaseService:
    """Service for interacting with MongoDB, with in-memory fallback."""
    def __init__(self):
        self.client = None
        self.db = None
        self._in_memory_db = {
            "transactions": [],
            "budgets": [],
            "users": []
        }
        self.use_memory = False

    async def connect(self):
        try:
            self.client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=2000)
            # Force a call to check if DB is actually available
            await self.client.admin.command('ping')
            self.db = self.client[settings.database_name]
            logger.info("Connected to MongoDB successfully.")
        except Exception as e:
            logger.warning(f"Could not connect to MongoDB: {e}. Falling back to in-memory store.")
            self.use_memory = True

    async def disconnect(self):
        if self.client:
            self.client.close()

    async def insert_transactions(self, user_id: str, transactions: List[Dict[str, Any]]):
        if self.use_memory:
            for t in transactions:
                t_copy = dict(t)
                t_copy['user_id'] = user_id
                self._in_memory_db["transactions"].append(t_copy)
            return True
            
        collection = self.db["transactions"]
        docs = []
        for t in transactions:
            doc = dict(t)
            doc['user_id'] = user_id
            docs.append(doc)
        if docs:
            await collection.insert_many(docs)
        return True

    async def get_transactions(self, user_id: str) -> List[Dict[str, Any]]:
        if self.use_memory:
            return [t for t in self._in_memory_db["transactions"] if t.get('user_id') == user_id]
            
        collection = self.db["transactions"]
        cursor = collection.find({"user_id": user_id})
        # Remove _id for pydantic compatibility easily
        return [{**doc, "_id": str(doc["_id"])} async for doc in cursor]

db_service = DatabaseService()
