from typing import Dict, Any, List

class BudgetPlanningAgent:
    """Agent for planning and assessing budgets using the 50-30-20 rule."""

    def __init__(self):
        self.category_mapping = {
            "Needs": ["Bills", "Healthcare", "Education"],
            "Wants": ["Shopping", "Entertainment"],
            "PartialNeeds": ["Food", "Transport"], # Can be split
            "PartialWants": ["Food", "Transport"],
        }

    def apply_503020_rule(self, monthly_income: float) -> Dict[str, float]:
        """Calculate optimal budget split based on 50/30/20 rule."""
        return {
            "needs": monthly_income * 0.50,
            "wants": monthly_income * 0.30,
            "savings": monthly_income * 0.20
        }

    def analyze_current_spending(self, expense_analysis: Dict[str, Any]) -> Dict[str, float]:
        """Analyze current spending allocation (needs/wants)."""
        cat_spending = expense_analysis.get("category_wise_spending", {})
        
        needs_spent = 0.0
        wants_spent = 0.0
        
        for category, amount in cat_spending.items():
            if category in self.category_mapping["Needs"]:
                needs_spent += amount
            elif category in self.category_mapping["Wants"]:
                wants_spent += amount
            elif category in ["Food", "Transport"]:
                # Split 50/50 for simplicity if in partials
                needs_spent += amount * 0.5
                wants_spent += amount * 0.5
            else:
                # Default unknown to wants
                wants_spent += amount
                
        total = max(1.0, needs_spent + wants_spent) # avoid div by zero
        return {
            "needs_percentage": (needs_spent / total) * 100,
            "wants_percentage": (wants_spent / total) * 100,
            "needs_spent": needs_spent,
            "wants_spent": wants_spent
        }

    def create_budget(self, monthly_income: float, expense_analysis: Dict[str, Any], saving_goal: float = None) -> Dict[str, Any]:
        """Create a comprehensive budget plan."""
        ideal_split = self.apply_503020_rule(monthly_income)
        current = self.analyze_current_spending(expense_analysis)
        
        savings_target = saving_goal if saving_goal else ideal_split["savings"]
        
        # Detailed recommended budget by category (proportional to ideal split)
        # Simplified: allocate equally among categories in needs/wants
        needs_cats = self.category_mapping["Needs"] + ["Food", "Transport"]
        wants_cats = self.category_mapping["Wants"] + ["Others"]
        
        recommended = {}
        if needs_cats:
            need_limit = ideal_split["needs"] / len(needs_cats)
            for c in needs_cats: recommended[c] = need_limit
        if wants_cats:
            want_limit = ideal_split["wants"] / len(wants_cats)
            for c in wants_cats: recommended[c] = want_limit

        warnings = []
        if current["needs_spent"] > ideal_split["needs"]:
            warnings.append("You are over-budget on Needs (Target: 50%).")
        if current["wants_spent"] > ideal_split["wants"]:
            warnings.append("You are over-budget on Wants (Target: 30%).")
            
        tips = [
            "Cook at home to reduce food expenses.",
            "Review and cancel unused subscriptions.",
            "Use public transport when possible."
        ]
        
        # Health score calculation
        score = 100
        if current["needs_spent"] > ideal_split["needs"]:
            score -= 20 * ((current["needs_spent"] - ideal_split["needs"]) / ideal_split["needs"])
        if current["wants_spent"] > ideal_split["wants"]:
            score -= 20 * ((current["wants_spent"] - ideal_split["wants"]) / ideal_split["wants"])
            
        score = max(0, min(100, score)) # clamp between 0-100

        return {
            "recommended_budget": recommended,
            "savings_target": savings_target,
            "budget_allocation": {
                "needs_budget": ideal_split["needs"],
                "wants_budget": ideal_split["wants"],
                "savings_budget": ideal_split["savings"]
            },
            "warnings": warnings,
            "tips": tips,
            "budget_health_score": round(score, 2)
        }
