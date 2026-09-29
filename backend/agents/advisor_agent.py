from typing import Dict, Any, List

class AdvisorAgent:
    """Agent that synthesizes data into Natural Language advice."""

    def generate_advice(self, expense_analysis: Dict[str, Any], budget_plan: Dict[str, Any], prediction: Dict[str, Any], anomalies: Dict[str, Any], user_query: str = None) -> Dict[str, Any]:
        """Generate human-readable financial advice based on complete analysis."""
        
        # Construct summary
        risk = expense_analysis.get("risk_level", "Low")
        score = budget_plan.get("budget_health_score", 100)
        
        summary = f"Your overall budget health score is {score}/100. "
        if risk == "High":
            summary += "Your spending patterns indicate high risk. Immediate action is recommended to align with your income."
        else:
            summary += "You are maintaining a reasonably healthy financial profile."
            
        # Top recommendations
        recs = []
        if budget_plan.get("warnings"):
            recs.append("Reduce spending in categories where you have exceeded the recommended budget limits.")
        if anomalies.get("flagged_transactions"):
            recs.append("Review flagged unusual transactions to ensure there is no fraudulent activity.")
        
        highest_cat = expense_analysis.get("highest_expense_category")
        if highest_cat:
            recs.append(f"Consider minimizing your expenses in the '{highest_cat}' category, which is currently your highest spend.")
            
        recs.append("Follow the 50/30/20 rule to maintain a balance between Needs, Wants, and Savings.")
        recs.append("Setup an automated savings transfer to ensure your savings targets are met early in the month.")

        # Savings opportunities
        savings_opp = []
        cat_spending = expense_analysis.get("category_wise_spending", {})
        food_spend = cat_spending.get("Food", 0)
        if food_spend > 0:
            potential_saving = food_spend * 0.25
            savings_opp.append(f"Your food expenses are ₹{food_spend:.2f}. Reducing food delivery could save you approximately ₹{potential_saving:.2f}.")
            
        wants_budget = budget_plan.get("budget_allocation", {}).get("wants_budget", 0)
        # Check if actual wants exceeded
        # Just an example generic tip if specific data isn't easily accessible here
        savings_opp.append("You might be spending over your needs/wants budget. Consider reviewing subscription services to save more.")

        # Risk Assessment narrative
        pred_risk = prediction.get("risk_level", "Low")
        risk_narrative = f"Based on current trends, your future financial risk is evaluated as {pred_risk}. "
        if pred_risk == "High":
            risk_narrative += "Your predicted expenses are alarmingly close to your income level."
            
        # Query response
        query_resp = None
        if user_query:
            query_resp = f"You asked: '{user_query}'. Based on your data, please focus on managing your largest expense categories to align with this goal."

        return {
            "summary": summary,
            "top_recommendations": recs[:5], # ensure max 5
            "savings_opportunities": savings_opp,
            "risk_assessment": risk_narrative,
            "response_to_query": query_resp
        }
