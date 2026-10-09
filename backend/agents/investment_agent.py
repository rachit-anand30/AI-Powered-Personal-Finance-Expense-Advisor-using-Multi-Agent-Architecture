from typing import Dict, Any, List


class InvestmentAgent:
    """Agent that plans where the monthly surplus should go.

    Follows the standard personal-finance priority ladder used in Indian financial-literacy material:
      1. Emergency fund (6 months of expenses) in a liquid / savings account
      2. Term + health insurance cover (protection before returns)
      3. Long-term wealth via diversified SIPs, split by a simple risk profile
    Output is educational guidance generated from rules, not personalised investment advice.
    """

    EMERGENCY_MONTHS = 6

    # Allocation of investable surplus by risk profile (equity / debt / gold), percentages
    PROFILES = {
        "Conservative": {"Equity index funds": 30, "Debt funds / PPF / FD": 55, "Gold (SGB / ETF)": 15},
        "Balanced":     {"Equity index funds": 55, "Debt funds / PPF / FD": 35, "Gold (SGB / ETF)": 10},
        "Aggressive":   {"Equity index funds": 75, "Debt funds / PPF / FD": 15, "Gold (SGB / ETF)": 10},
    }

    def assess_risk_profile(self, savings_rate: float, prediction_risk: str, anomaly_risk: str) -> str:
        """Infer capacity to take investment risk from the other agents' findings."""
        if savings_rate < 10 or prediction_risk == "High":
            return "Conservative"
        if savings_rate >= 30 and prediction_risk == "Low" and anomaly_risk != "High":
            return "Aggressive"
        return "Balanced"

    def create_investment_plan(self, monthly_income: float, budget_plan: Dict[str, Any],
                               predictions: Dict[str, Any], anomalies: Dict[str, Any],
                               current_investments: float = 0.0) -> Dict[str, Any]:
        actual = budget_plan.get("actual_allocation", {})
        monthly_expenses = actual.get("needs_spent", 0.0) + actual.get("wants_spent", 0.0)
        surplus = actual.get("savings", monthly_income - monthly_expenses)
        savings_rate = budget_plan.get("savings_rate", 0.0)

        profile = self.assess_risk_profile(savings_rate, predictions.get("risk_level", "Low"),
                                           anomalies.get("risk_level", "Low"))
        emergency_target = monthly_expenses * self.EMERGENCY_MONTHS

        steps: List[Dict[str, Any]] = []
        if surplus <= 0:
            return {
                "investable_surplus": 0.0,
                "risk_profile": "Conservative",
                "emergency_fund_target": round(emergency_target, 2),
                "monthly_plan": [],
                "allocation": {},
                "steps": [{
                    "title": "Fix cash flow first",
                    "detail": f"You are short by ₹{-surplus:,.0f}/month. Investing is paused until spending is below income - "
                              "follow the Budget Planner's cuts first.",
                }],
                "projection": [],
                "disclaimer": "Educational guidance only, not personalised investment advice.",
            }

        # Monthly split: build the emergency fund in parallel with investing
        emergency_share = 0.4 if profile == "Conservative" else 0.3
        to_emergency = surplus * emergency_share
        investable = surplus - to_emergency
        allocation = {k: round(investable * pct / 100, 2) for k, pct in self.PROFILES[profile].items()}
        months_to_emergency = emergency_target / to_emergency if to_emergency > 0 else None

        steps.append({
            "title": "Build an emergency fund",
            "detail": f"Park ₹{to_emergency:,.0f}/month in a high-yield savings account or liquid fund until you have "
                      f"₹{emergency_target:,.0f} ({self.EMERGENCY_MONTHS} months of expenses)"
                      + (f" - about {months_to_emergency:.0f} months away." if months_to_emergency else "."),
        })
        steps.append({
            "title": "Get protected",
            "detail": "Before chasing returns, make sure you have term life cover (~10x annual income if you have dependants) "
                      "and a health insurance policy.",
        })
        steps.append({
            "title": f"Invest ₹{investable:,.0f}/month ({profile} profile)",
            "detail": ", ".join(f"{k}: ₹{v:,.0f}" for k, v in allocation.items()) + " via monthly SIPs.",
        })
        if current_investments > 0:
            steps.append({
                "title": "Keep your existing SIPs running",
                "detail": f"You already invested ₹{current_investments:,.0f} in this period - consistency beats timing.",
            })

        # Illustrative future value of the monthly SIP at a blended expected return
        expected_return = {"Conservative": 0.08, "Balanced": 0.10, "Aggressive": 0.12}[profile]
        r = expected_return / 12
        projection = []
        for years in (1, 3, 5, 10):
            n = years * 12
            fv = investable * (((1 + r) ** n - 1) / r) * (1 + r)
            projection.append({"years": years, "invested": round(investable * n, 0), "value": round(fv, 0)})

        return {
            "investable_surplus": round(surplus, 2),
            "risk_profile": profile,
            "emergency_fund_target": round(emergency_target, 2),
            "monthly_plan": [
                {"bucket": "Emergency fund", "amount": round(to_emergency, 2)},
                *({"bucket": k, "amount": v} for k, v in allocation.items()),
            ],
            "allocation": allocation,
            "expected_annual_return": expected_return * 100,
            "steps": steps,
            "projection": projection,
            "disclaimer": "Educational guidance only, not personalised investment advice. Returns are illustrative.",
        }
