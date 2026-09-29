from typing import List, Dict, Any
from datetime import datetime

class ExpenseAnalyzerAgent:
    """Agent responsible for categorizing and analyzing expenses."""

    def __init__(self):
        self.keywords = {
            "Food": ["swiggy", "zomato", "restaurant", "cafe", "food", "pizza", "burger", "chai", "coffee", "meal"],
            "Transport": ["uber", "ola", "petrol", "metro", "bus", "auto", "taxi", "fuel", "parking"],
            "Shopping": ["amazon", "flipkart", "myntra", "mall", "clothes", "shoes", "fashion", "market"],
            "Entertainment": ["netflix", "spotify", "movie", "cinema", "game", "pub", "bar", "concert"],
            "Bills": ["electricity", "water", "rent", "internet", "mobile", "broadband", "dth", "insurance"],
            "Healthcare": ["pharmacy", "doctor", "hospital", "medicine", "clinic", "apollo", "medplus"],
            "Education": ["course", "book", "college", "tuition", "udemy", "coursera", "school"]
        }

    def categorize_transaction(self, description: str, amount: float) -> str:
        """Categorize a transaction based on its description."""
        desc_lower = description.lower()
        for category, keywords in self.keywords.items():
            for keyword in keywords:
                if keyword in desc_lower:
                    return category
        return "Others"

    def analyze_transactions(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze a list of transactions and return summary metrics."""
        if not transactions:
            return {
                "category_wise_spending": {},
                "monthly_total": 0.0,
                "daily_average": 0.0,
                "spending_percentages": {},
                "highest_expense_category": None,
                "overspending_alerts": [],
                "trends": {},
                "risk_level": "Low"
            }

        category_wise = {}
        total = 0.0
        
        # Categorize and aggregate
        for t in transactions:
            category = t.get("category")
            if not category:
                category = self.categorize_transaction(t["description"], t["amount"])
                t["category"] = category
            
            amount = t["amount"]
            category_wise[category] = category_wise.get(category, 0.0) + amount
            total += amount

        # Assumes transactions are over a 30 day period if daily_average needs calculation
        # To be safe, calculate days based on date range
        dates = []
        for t in transactions:
            if isinstance(t["date"], str):
                dates.append(datetime.fromisoformat(t["date"]))
            else:
                dates.append(t["date"])
        
        if dates:
            days = max(1, (max(dates) - min(dates)).days + 1)
        else:
            days = 30
            
        daily_avg = total / days

        # Percentages
        percentages = {k: (v / total) * 100 for k, v in category_wise.items()}
        
        # Highest expense category
        highest_cat = max(category_wise, key=category_wise.get) if category_wise else None
        
        # Alerts
        alerts = [k for k, v in percentages.items() if v > 30.0]

        # Trends (simplified to match requirements: compare first vs second half based on days)
        # Using simple median date split
        if len(dates) > 1:
            dates.sort()
            mid_date = dates[len(dates)//2]
            first_half = sum(t["amount"] for t in transactions if (isinstance(t["date"], str) and datetime.fromisoformat(t["date"]) <= mid_date) or (not isinstance(t["date"], str) and t["date"] <= mid_date))
            second_half = total - first_half
        else:
            first_half = total
            second_half = 0.0

        trends = {
            "first_half_spending": first_half,
            "second_half_spending": second_half
        }
        
        # Risk level (Simplified: if total > typical income, we'd say high. Let's base it on a standard threshold or assume missing income means Low)
        # Without income provided to this func, we fallback to relative thresholds.
        risk_level = "Low"
        if len(alerts) >= 2:
            risk_level = "High"
        elif len(alerts) == 1:
            risk_level = "Medium"

        return {
            "category_wise_spending": category_wise,
            "monthly_total": total,
            "daily_average": daily_avg,
            "spending_percentages": percentages,
            "highest_expense_category": highest_cat,
            "overspending_alerts": alerts,
            "trends": trends,
            "risk_level": risk_level
        }
