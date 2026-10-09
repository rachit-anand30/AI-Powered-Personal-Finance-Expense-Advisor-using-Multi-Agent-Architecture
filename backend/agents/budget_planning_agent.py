import heapq
from typing import Dict, Any, Optional, List


class BudgetPlanningAgent:
    """Agent for planning and assessing budgets using the 50-30-20 rule."""

    def __init__(self):
        self.category_mapping = {
            "Needs": ["Bills", "Healthcare", "Education"],
            "Wants": ["Shopping", "Entertainment", "Others"],
            "Split": ["Food", "Transport"],  # essential part + discretionary part, split 50/50
        }
        self.tips_by_category = {
            "Food": "Cook at home more often - food delivery typically costs 2-3x a home-cooked meal.",
            "Shopping": "Use a 48-hour rule before non-essential purchases and unsubscribe from sale emails.",
            "Entertainment": "Audit streaming subscriptions and keep only the ones you used this month.",
            "Transport": "Use metro/bus or carpool for regular commutes instead of cabs.",
            "Bills": "Compare internet/mobile plans and switch off standby appliances to cut utility bills.",
            "Others": "Tag 'Others' transactions properly - unknown spending is the hardest to control.",
            "Healthcare": "Use generic medicines and check if your insurance covers routine visits.",
            "Education": "Look for free/audit options on Coursera, NPTEL or YouTube before paying for courses.",
        }

        # Search model for cutting spending: how much each rupee cut "hurts" (pain weight) and the
        # deepest cut we allow (floor) per category. Essentials are expensive and shallow to cut.
        self.cut_pain = {"Bills": 12.0, "Healthcare": 8.0, "Education": 5.0, "Food": 2.0, "Transport": 2.0,
                         "Shopping": 1.0, "Entertainment": 1.0, "Others": 1.2}
        self.max_cut = {"Bills": 0.10, "Healthcare": 0.05, "Education": 0.20, "Food": 0.40, "Transport": 0.40,
                        "Shopping": 0.70, "Entertainment": 0.70, "Others": 0.60}
        self.cut_step = 0.05  # each search action cuts 5% of a category's current spend

    def optimize_cuts(self, monthly_by_cat: Dict[str, float], savings_gap: float) -> Dict[str, Any]:
        """Greedy best-first search for the least painful set of cuts that closes the savings gap.

        State: how many 5% steps have been cut from each category. Action: cut one more step.
        Priority (heuristic): pain per rupee saved = pain_weight * (1 + steps_already_cut).
        The increasing cost models diminishing willingness to cut the same category again,
        so the search spreads cuts sensibly instead of zeroing out one category.
        Goal test: total savings >= savings_gap, or the frontier is empty (gap not closable).
        """
        frontier: List[tuple] = []
        for cat, amount in monthly_by_cat.items():
            if amount > 0:
                heapq.heappush(frontier, (self.cut_pain.get(cat, 1.5), cat, 1))

        cuts = {cat: 0.0 for cat in monthly_by_cat}
        saved, expanded = 0.0, 0
        while frontier and saved < savings_gap:
            cost, cat, step = heapq.heappop(frontier)
            expanded += 1
            step_amount = monthly_by_cat[cat] * self.cut_step
            cuts[cat] += step_amount
            saved += step_amount
            if step * self.cut_step < self.max_cut.get(cat, 0.5) - 1e-9:
                heapq.heappush(frontier, (self.cut_pain.get(cat, 1.5) * (1 + step), cat, step + 1))

        return {
            "cuts": {c: round(v, 2) for c, v in cuts.items() if v >= 50},
            "total_saved": round(saved, 2),
            "goal_reached": saved >= savings_gap,
            "nodes_expanded": expanded,
            "strategy": "Greedy best-first search (priority queue on pain per rupee)",
        }

    def apply_503020_rule(self, monthly_income: float, saving_goal: Optional[float] = None) -> Dict[str, float]:
        """Ideal split by the 50/30/20 rule. A higher saving goal is taken out of 'wants'."""
        needs = monthly_income * 0.50
        savings = monthly_income * 0.20
        if saving_goal and saving_goal > savings:
            savings = min(saving_goal, monthly_income - needs)
        wants = max(0.0, monthly_income - needs - savings)
        return {"needs": needs, "wants": wants, "savings": savings}

    def analyze_current_spending(self, expense_analysis: Dict[str, Any]) -> Dict[str, float]:
        """Analyze current monthly spending allocation (needs/wants)."""
        months = max(1, expense_analysis.get("months_covered") or 1)
        needs_spent = 0.0
        wants_spent = 0.0
        for category, amount in expense_analysis.get("category_wise_spending", {}).items():
            monthly = amount / months
            if category in self.category_mapping["Needs"]:
                needs_spent += monthly
            elif category in self.category_mapping["Split"]:
                needs_spent += monthly * 0.5
                wants_spent += monthly * 0.5
            else:
                wants_spent += monthly
        total = max(1.0, needs_spent + wants_spent)
        return {
            "needs_percentage": (needs_spent / total) * 100,
            "wants_percentage": (wants_spent / total) * 100,
            "needs_spent": needs_spent,
            "wants_spent": wants_spent,
        }

    def create_budget(self, monthly_income: float, expense_analysis: Dict[str, Any], saving_goal: float = None,
                      anomalies: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a comprehensive budget plan.

        Transactions flagged by the Anomaly agent are set aside until verified, so a fraudulent
        charge does not turn into a permanent "cut your Shopping" recommendation.
        """
        flagged = (anomalies or {}).get("flagged_transactions", [])
        if flagged:
            spending = dict(expense_analysis.get("category_wise_spending", {}))
            for a in flagged:
                cat = a.get("category", "Others")
                spending[cat] = max(0.0, spending.get(cat, 0.0) - a["amount"])
            expense_analysis = {**expense_analysis, "category_wise_spending": {c: v for c, v in spending.items() if v > 0}}
        excluded_total = sum(a["amount"] for a in flagged)

        ideal = self.apply_503020_rule(monthly_income, saving_goal)
        current = self.analyze_current_spending(expense_analysis)
        months = max(1, expense_analysis.get("months_covered") or 1)
        monthly_by_cat = {c: a / months for c, a in expense_analysis.get("category_wise_spending", {}).items()}

        needs_spent, wants_spent = current["needs_spent"], current["wants_spent"]
        total_spent = needs_spent + wants_spent
        actual_savings = monthly_income - total_spent
        savings_rate = (actual_savings / monthly_income * 100) if monthly_income > 0 else 0.0

        # Per-category limits: search for the gentlest cuts that reach the savings target
        savings_gap = max(0.0, ideal["savings"] - actual_savings) if monthly_income > 0 else 0.0
        search = self.optimize_cuts(monthly_by_cat, savings_gap)
        recommended = {}
        for cat, monthly in monthly_by_cat.items():
            limit = monthly - search["cuts"].get(cat, 0.0)
            recommended[cat] = round(limit, -1) if limit >= 100 else round(limit, 2)

        # Warnings, most serious first
        warnings = []
        if monthly_income <= 0:
            warnings.append("Add your monthly income to get a meaningful budget plan.")
        else:
            if actual_savings < 0:
                warnings.append(f"You are spending ₹{-actual_savings:,.0f} more than you earn each month.")
            elif savings_rate < 20:
                warnings.append(f"You spend {100 - savings_rate:.1f}% of your income - only {savings_rate:.1f}% is left to save (target: 20%).")
            if needs_spent > ideal["needs"]:
                warnings.append(f"Needs are ₹{needs_spent - ideal['needs']:,.0f} over the 50% target (₹{ideal['needs']:,.0f}).")
            if wants_spent > ideal["wants"]:
                warnings.append(f"Wants are ₹{wants_spent - ideal['wants']:,.0f} over the {ideal['wants'] / monthly_income * 100:.0f}% target (₹{ideal['wants']:,.0f}).")
            for cat, cut in sorted(search["cuts"].items(), key=lambda kv: kv[1], reverse=True)[:3]:
                warnings.append(f"Cut {cat} by ₹{cut:,.0f}/month (₹{monthly_by_cat[cat]:,.0f} → ₹{monthly_by_cat[cat] - cut:,.0f}).")
            if excluded_total:
                warnings.append(f"₹{excluded_total:,.0f} in flagged transactions is excluded from this plan until you verify it.")

        # Tips targeted at the categories that are hurting the most
        ranked = sorted(monthly_by_cat, key=lambda c: monthly_by_cat[c] - recommended.get(c, 0), reverse=True)
        tips = [self.tips_by_category[c] for c in ranked if c in self.tips_by_category][:3]
        tips.append("Automate a transfer of your savings target on payday so you save before you spend.")

        # Health score (0-100): 50 pts savings, 25 pts needs adherence, 25 pts wants adherence.
        # Adherence is squared so large overspends hurt more than small ones.
        if monthly_income <= 0:
            score = 0.0
        else:
            savings_pts = 50 * max(0.0, min(1.0, actual_savings / ideal["savings"])) if ideal["savings"] > 0 else 50
            needs_pts = 25 * (min(1.0, ideal["needs"] / needs_spent) ** 2 if needs_spent else 1.0)
            wants_pts = 25 * (min(1.0, ideal["wants"] / wants_spent) ** 2 if wants_spent else 1.0)
            score = savings_pts + needs_pts + wants_pts

        ratio = total_spent / monthly_income if monthly_income > 0 else 1.0
        risk_level = "High" if ratio > 0.9 or score < 50 else "Medium" if ratio > 0.8 or score < 75 else "Low"

        return {
            "recommended_budget": recommended,
            "savings_target": saving_goal if saving_goal else ideal["savings"],
            "budget_allocation": {
                "needs_budget": ideal["needs"],
                "wants_budget": ideal["wants"],
                "savings_budget": ideal["savings"],
            },
            "actual_allocation": {
                "needs_spent": round(needs_spent, 2),
                "wants_spent": round(wants_spent, 2),
                "savings": round(actual_savings, 2),
            },
            "savings_rate": round(savings_rate, 2),
            "warnings": warnings,
            "tips": tips,
            "budget_health_score": round(score, 1),
            "risk_level": risk_level,
            "optimization": search,
            "excluded_flagged_amount": excluded_total,
        }
