import re
from typing import List, Dict, Any, Optional
from datetime import datetime, date
try:
    from ..services.ml_service import ml_service
except (ImportError, ValueError):
    from services.ml_service import ml_service


def to_date(value: Any) -> date:
    """Normalise a str / date / datetime into a date."""
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return datetime.fromisoformat(str(value)[:10]).date()


class ExpenseAnalyzerAgent:
    """Agent responsible for categorizing and analyzing expenses."""

    # Money moved into investments is saving, not spending.
    SAVINGS_CATEGORIES = {"Investments"}

    # Healthy share of monthly income per category (used for overspending alerts when income is known).
    INCOME_BENCHMARKS = {
        "Bills": 0.40,
        "Food": 0.15,
        "Transport": 0.10,
        "Shopping": 0.10,
        "Entertainment": 0.05,
        "Healthcare": 0.10,
        "Education": 0.15,
        "Others": 0.10,
    }

    def __init__(self):
        self.keywords = {
            "Investments": ["sip", "mutual fund", "mutual funds", "stock", "stocks", "zerodha", "groww", "ppf", "fixed deposit", "fd", "investment"],
            "Food": ["swiggy", "zomato", "restaurant", "cafe", "food", "pizza", "burger", "chai", "coffee", "meal", "grocery", "groceries",
                     "supermarket", "bigbasket", "blinkit", "zepto", "dmart", "dominos", "starbucks", "kfc", "mcdonalds", "lunch", "dinner"],
            "Transport": ["uber", "ola", "rapido", "petrol", "diesel", "metro", "bus", "auto", "taxi", "cab", "fuel", "parking", "irctc", "train", "flight", "toll", "fastag"],
            "Shopping": ["amazon", "flipkart", "myntra", "ajio", "nykaa", "mall", "clothes", "shoes", "fashion", "market", "shopping", "electronics", "watch"],
            "Entertainment": ["netflix", "spotify", "prime", "hotstar", "bookmyshow", "movie", "movies", "cinema", "game", "games", "pub", "bar", "concert", "pvr", "youtube"],
            "Bills": ["electricity", "water", "rent", "internet", "mobile", "broadband", "dth", "insurance", "emi", "loan", "wifi",
                      "recharge", "jio", "airtel", "vi", "gas", "maintenance", "bill"],
            "Healthcare": ["pharmacy", "doctor", "hospital", "medicine", "medicines", "clinic", "apollo", "medplus", "pharmeasy", "gym", "dental", "lab"],
            "Education": ["course", "courses", "book", "books", "college", "tuition", "udemy", "coursera", "school", "fees", "exam"],
        }
        # Whole-word matching so "business" is not "bus" and "supermarket" is not "market".
        self._patterns = {
            category: re.compile(r"\b(" + "|".join(re.escape(k) for k in kws) + r")\b", re.IGNORECASE)
            for category, kws in self.keywords.items()
        }

    ML_CONFIDENT = 0.55   # trust the ML model outright above this probability
    ML_MINIMUM = 0.30     # below this, an unmatched description is "Others"

    def keyword_category(self, description: str) -> Optional[str]:
        """Whole-word keyword rule match, or None."""
        for category, pattern in self._patterns.items():
            if pattern.search(description or ""):
                return category
        return None

    def classify(self, description: str) -> Dict[str, Any]:
        """Hybrid NLP classification: ML model first, keyword rules as a safety net.

        1. ML probability >= 0.55             -> ML label
        2. otherwise a keyword rule matches   -> rule label
        3. otherwise ML probability >= 0.30   -> ML label (low confidence)
        4. otherwise                          -> Others
        """
        ml = ml_service.predict(description)
        if ml and ml[1] >= self.ML_CONFIDENT:
            return {"category": ml[0], "source": "ml", "confidence": round(ml[1] * 100, 1)}
        rule = self.keyword_category(description)
        if rule:
            return {"category": rule, "source": "rules", "confidence": 100.0}
        if ml and ml[1] >= self.ML_MINIMUM:
            return {"category": ml[0], "source": "ml", "confidence": round(ml[1] * 100, 1)}
        return {"category": "Others", "source": "default", "confidence": round(ml[1] * 100, 1) if ml else 0.0}

    def categorize_transaction(self, description: str, amount: float = 0.0) -> str:
        """Categorize a transaction from its description."""
        return self.classify(description)["category"]

    def _empty_analysis(self) -> Dict[str, Any]:
        return {
            "category_wise_spending": {},
            "monthly_total": 0.0,
            "total_spending": 0.0,
            "months_covered": 0,
            "investments_total": 0.0,
            "daily_average": 0.0,
            "spending_percentages": {},
            "highest_expense_category": None,
            "overspending_alerts": [],
            "trends": {},
            "savings_rate": None,
            "risk_level": "Low",
        }

    def analyze_transactions(self, transactions: List[Dict[str, Any]], monthly_income: Optional[float] = None) -> Dict[str, Any]:
        """Analyze a list of transactions and return summary metrics.

        Non-positive amounts (refunds/reversals) are ignored. Investment transfers are reported
        separately and do not count as spending. If monthly_income is given, alerts and the
        risk level are judged against income; otherwise against the user's own spending mix.
        """
        # Categorize every transaction (the coordinator relies on this mutation for downstream agents)
        for t in transactions:
            if t.get("category"):
                t.setdefault("category_source", "user")
            else:
                result = self.classify(t.get("description", ""))
                t["category"] = result["category"]
                t["category_source"] = result["source"]
                t["category_confidence"] = result["confidence"]

        valid = [t for t in transactions if float(t.get("amount", 0)) > 0]
        spending = [t for t in valid if t["category"] not in self.SAVINGS_CATEGORIES]
        investments_total = sum(float(t["amount"]) for t in valid if t["category"] in self.SAVINGS_CATEGORIES)

        if not spending:
            result = self._empty_analysis()
            result["investments_total"] = investments_total
            return result

        category_wise: Dict[str, float] = {}
        for t in spending:
            category_wise[t["category"]] = category_wise.get(t["category"], 0.0) + float(t["amount"])
        total = sum(category_wise.values())

        dates = [to_date(t["date"]) for t in spending]
        days = max(1, (max(dates) - min(dates)).days + 1)
        months_covered = len({(d.year, d.month) for d in dates})
        monthly_total = total / months_covered

        percentages = {k: (v / total) * 100 for k, v in category_wise.items()}
        highest_cat = max(category_wise, key=category_wise.get)

        if monthly_income and monthly_income > 0:
            alerts = [
                cat for cat, amt in category_wise.items()
                if (amt / months_covered) > monthly_income * self.INCOME_BENCHMARKS.get(cat, 0.10)
            ]
            savings_rate = (monthly_income - monthly_total) / monthly_income * 100
        else:
            alerts = [k for k, v in percentages.items() if v > 30.0]
            savings_rate = None

        # Trend: spending in the first vs second half of the period (split at the median date)
        sorted_dates = sorted(dates)
        mid_date = sorted_dates[len(sorted_dates) // 2]
        if len(sorted_dates) > 1:
            first_half = sum(float(t["amount"]) for t in spending if to_date(t["date"]) < mid_date)
        else:
            first_half = total
        trends = {"first_half_spending": first_half, "second_half_spending": total - first_half}

        # Risk: income-aware when we know the income, mix-based otherwise
        if savings_rate is not None:
            if savings_rate < 10 or len(alerts) >= 3:
                risk_level = "High"
            elif savings_rate < 20 or alerts:
                risk_level = "Medium"
            else:
                risk_level = "Low"
        else:
            risk_level = "High" if len(alerts) >= 2 else "Medium" if alerts else "Low"

        return {
            "category_wise_spending": category_wise,
            "monthly_total": monthly_total,
            "total_spending": total,
            "months_covered": months_covered,
            "investments_total": investments_total,
            "daily_average": total / days,
            "spending_percentages": percentages,
            "highest_expense_category": highest_cat,
            "overspending_alerts": alerts,
            "trends": trends,
            "savings_rate": savings_rate,
            "risk_level": risk_level,
        }
