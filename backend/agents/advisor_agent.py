import re
from typing import Dict, Any, List, Optional

PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}


class AdvisorAgent:
    """Agent that synthesizes every other agent's output into natural-language advice.

    - Recommendations are generated from the actual numbers (no canned text).
    - User questions are answered by a lightweight NLP pipeline: normalise -> intent detection
      by keyword scoring -> entity extraction (amounts, categories) -> templated, data-filled answer.
    """

    INTENTS = {
        "afford":     ["afford", "buy", "purchase", "spend on", "get a", "can i get"],
        "save":       ["save", "saving", "savings", "cut", "reduce", "lower"],
        "invest":     ["invest", "sip", "mutual fund", "stock", "wealth", "grow"],
        "fraud":      ["fraud", "suspicious", "unusual", "anomaly", "strange", "scam"],
        "forecast":   ["predict", "next month", "forecast", "future", "trend"],
        "budget":     ["budget", "50/30/20", "50-30-20", "plan", "limit"],
        "category":   [],   # matched through category names below
        "health":     ["how am i doing", "health", "score", "overall", "status"],
    }
    CATEGORY_WORDS = {
        "Food": ["food", "eating", "swiggy", "zomato", "groceries", "restaurant"],
        "Transport": ["transport", "travel", "uber", "ola", "cab", "petrol", "commute"],
        "Shopping": ["shopping", "amazon", "flipkart", "clothes"],
        "Entertainment": ["entertainment", "netflix", "movies", "subscriptions", "ott"],
        "Bills": ["bills", "rent", "electricity", "utilities"],
        "Healthcare": ["health care", "healthcare", "medical", "medicine", "doctor"],
        "Education": ["education", "course", "college", "fees"],
    }
    SUBSCRIPTIONS = re.compile(r"\b(netflix|spotify|prime|hotstar|youtube|zee5|sony ?liv|jiocinema|apple music|gaana)\b", re.I)
    FOOD_DELIVERY = re.compile(r"\b(swiggy|zomato|dominos|eatsure|faasos)\b", re.I)

    # ---------- helpers ----------
    @staticmethod
    def _money(x: float) -> str:
        return f"₹{x:,.0f}"

    @staticmethod
    def extract_amount(text: str) -> Optional[float]:
        """Pull a rupee amount out of free text: '₹30,000', 'rs 30000', '30k', '1.5 lakh'."""
        t = text.lower().replace(",", "")
        m = re.search(r"(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac|l)\b", t)
        if m:
            mult = 1000 if m.group(2) in ("k", "thousand") else 100000
            return float(m.group(1)) * mult
        m = re.search(r"(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)", t) or re.search(r"\b(\d{3,}(?:\.\d+)?)\b", t)
        return float(m.group(1)) if m else None

    def detect_intent(self, query: str) -> Dict[str, Any]:
        q = query.lower()
        scores = {intent: sum(1 for kw in kws if kw in q) for intent, kws in self.INTENTS.items()}
        category = next((cat for cat, words in self.CATEGORY_WORDS.items() if any(w in q for w in words)), None)
        if category:
            scores["category"] += 1
        amount = self.extract_amount(query)
        if amount and scores["afford"] == 0 and scores["save"] == 0:
            scores["afford"] += 0.5
        intent = max(scores, key=scores.get) if max(scores.values()) > 0 else "health"
        # "how can I save on food" -> category-focused saving question
        if intent == "save" and category:
            intent = "category"
        return {"intent": intent, "category": category, "amount": amount}

    # ---------- main ----------
    def generate_advice(self, expense_analysis: Dict[str, Any], budget_plan: Dict[str, Any], prediction: Dict[str, Any],
                        anomalies: Dict[str, Any], user_query: str = None, transactions: List[Dict[str, Any]] = None,
                        monthly_income: float = 0.0, investment_plan: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate human-readable financial advice based on complete analysis."""
        transactions = transactions or []
        investment_plan = investment_plan or {}
        months = max(1, expense_analysis.get("months_covered") or 1)
        score = budget_plan.get("budget_health_score", 0)
        savings_rate = budget_plan.get("savings_rate", 0.0)
        actual = budget_plan.get("actual_allocation", {})
        surplus = actual.get("savings", 0.0)
        target = budget_plan.get("budget_allocation", {}).get("savings_budget", 0.0)
        cuts = budget_plan.get("optimization", {}).get("cuts", {})
        flagged = anomalies.get("flagged_transactions", [])

        # Summary
        if monthly_income <= 0:
            summary = "Add your monthly income so I can judge your spending against what you earn."
        elif surplus < 0:
            summary = (f"Health score {score:.0f}/100 - you're spending {self._money(-surplus)} more than you earn each month. "
                       "Let's fix cash flow before anything else.")
        elif score >= 80:
            summary = (f"Health score {score:.0f}/100 - great shape! You save {savings_rate:.0f}% of your income "
                       f"({self._money(surplus)}/month).")
        elif score >= 50:
            summary = (f"Health score {score:.0f}/100 - you're saving {savings_rate:.0f}% of income, "
                       f"below the 20% target. A few targeted cuts will get you there.")
        else:
            summary = (f"Health score {score:.0f}/100 - your finances need attention: only {max(savings_rate, 0):.0f}% "
                       "of income is being saved and spending exceeds the 50/30/20 limits.")
        if flagged:
            total = sum(a["amount"] for a in flagged)
            summary = (f"Security alert: {len(flagged)} suspicious transaction{'s' if len(flagged) > 1 else ''} worth "
                       f"{self._money(total)} need{'s' if len(flagged) == 1 else ''} your attention right away. "
                       f"Leaving {'it' if len(flagged) == 1 else 'them'} aside, " + summary[0].lower() + summary[1:])

        # Recommendations (structured, priority-ranked)
        recs: List[Dict[str, Any]] = []
        for a in flagged[:2]:
            recs.append({
                "title": f"Verify {self._money(a['amount'])} at {a['description']}",
                "description": f"On {a['date']} this was {a.get('times_typical', '?')}x your typical transaction "
                               f"(flagged by {', '.join(a.get('detected_by', []))}). If you don't recognise it, block your card "
                               "and report it to your bank immediately.",
                "impact_amount": a["amount"], "priority": "high", "agent": "Anomaly Detection",
            })
        if monthly_income > 0 and surplus < 0:
            recs.append({
                "title": "Spending exceeds income",
                "description": f"You are {self._money(-surplus)}/month in deficit. Pause non-essential purchases and apply the cuts below.",
                "impact_amount": -surplus, "priority": "high", "agent": "Budget Planner",
            })
        elif monthly_income > 0 and surplus < target:
            recs.append({
                "title": f"Save {self._money(target - surplus)} more per month",
                "description": f"You save {self._money(surplus)} ({savings_rate:.1f}%) against a target of {self._money(target)}. "
                               "Automate the transfer on payday so it happens before you spend.",
                "impact_amount": target - surplus, "priority": "medium", "agent": "Budget Planner",
            })
        for cat, amt in sorted(cuts.items(), key=lambda kv: kv[1], reverse=True)[:2]:
            recs.append({
                "title": f"Trim {cat} by {self._money(amt)}/month",
                "description": f"The budget search found this the least painful cut to reach your savings goal "
                               f"(current {self._money(expense_analysis['category_wise_spending'].get(cat, 0) / months)}/month).",
                "impact_amount": amt, "priority": "medium", "agent": "Budget Planner",
            })
        if prediction.get("trend_direction") == "Increasing" and prediction.get("predicted_expense"):
            recs.append({
                "title": "Spending is trending up",
                "description": f"Next month is forecast at {self._money(prediction['predicted_expense'])} "
                               f"({prediction.get('prediction_method')}, {prediction.get('confidence', 0):.0f}% confidence). "
                               "Set category limits now before the increase happens.",
                "impact_amount": prediction["predicted_expense"], "priority": "medium" if prediction.get("risk_level") != "High" else "high",
                "agent": "Prediction",
            })

        # Savings opportunities from the transaction text
        savings_opp: List[str] = []
        potential = 0.0
        subs = [t for t in transactions if self.SUBSCRIPTIONS.search(t.get("description", ""))]
        if subs:
            subs_monthly = sum(t["amount"] for t in subs) / months
            names = sorted({t["description"] for t in subs})
            savings_opp.append(f"{len(names)} streaming subscription{'s' if len(names) > 1 else ''} ({', '.join(names)}) cost "
                               f"{self._money(subs_monthly)}/month - sharing a family plan or dropping one saves ~{self._money(subs_monthly * 0.4)}.")
            potential += subs_monthly * 0.4
        delivery = [t for t in transactions if self.FOOD_DELIVERY.search(t.get("description", ""))]
        if delivery:
            d_monthly = sum(t["amount"] for t in delivery) / months
            savings_opp.append(f"Food delivery costs you {self._money(d_monthly)}/month across {len(delivery)} orders - "
                               f"cooking half of those meals saves ~{self._money(d_monthly * 0.35)}.")
            potential += d_monthly * 0.35
        for cat, amt in cuts.items():
            if cat not in ("Food", "Entertainment"):
                savings_opp.append(f"Reduce {cat} by {self._money(amt)}/month (Budget Planner recommendation).")
                potential += amt

        if investment_plan.get("investable_surplus", 0) > 0:
            recs.append({
                "title": f"Put {self._money(investment_plan['investable_surplus'])}/month to work",
                "description": investment_plan["steps"][0]["detail"] + f" Suggested profile: {investment_plan['risk_profile']}.",
                "impact_amount": investment_plan["investable_surplus"], "priority": "low", "agent": "Investment",
            })
        if not recs:
            recs.append({
                "title": "You're on track",
                "description": "Spending is within the 50/30/20 limits. Keep tracking monthly to stay there.",
                "impact_amount": 0, "priority": "low", "agent": "Advisor",
            })
        recs.sort(key=lambda r: PRIORITY_ORDER[r["priority"]])

        # Risk narrative
        pred_risk = prediction.get("risk_level", "Low")
        risk_narrative = f"Forecast risk is {pred_risk}"
        if prediction.get("predicted_expense"):
            risk_narrative += (f": next month's spending is predicted at {self._money(prediction['predicted_expense'])} "
                               f"vs income {self._money(monthly_income)}.")
        if prediction.get("excluded_one_offs"):
            risk_narrative += f" One-off flagged transactions ({self._money(prediction['excluded_one_offs'])}) were excluded from the forecast."

        query_resp = self.answer_query(user_query, expense_analysis, budget_plan, prediction, anomalies,
                                       investment_plan, monthly_income) if user_query else None

        return {
            "summary": summary,
            "top_recommendations": recs[:6],
            "savings_opportunities": savings_opp,
            "potential_monthly_savings": round(potential, 2),
            "risk_assessment": risk_narrative,
            "response_to_query": query_resp,
        }

    def answer_query(self, query: str, expense_analysis, budget_plan, prediction, anomalies, investment_plan,
                     monthly_income: float) -> Dict[str, Any]:
        parsed = self.detect_intent(query)
        intent, category, amount = parsed["intent"], parsed["category"], parsed["amount"]
        months = max(1, expense_analysis.get("months_covered") or 1)
        surplus = budget_plan.get("actual_allocation", {}).get("savings", 0.0)
        cuts = budget_plan.get("optimization", {}).get("cuts", {})
        spend = expense_analysis.get("category_wise_spending", {})
        recommended = budget_plan.get("recommended_budget", {})
        m = self._money

        if intent == "afford":
            if not amount:
                answer = "Tell me the price (e.g. 'Can I afford a ₹30,000 phone?') and I'll check it against your monthly surplus."
            elif surplus <= 0:
                answer = (f"Not right now - you have no monthly surplus (deficit {m(-surplus)}). "
                          f"Apply the suggested cuts first ({m(sum(cuts.values()))}/month) and revisit.")
            else:
                months_needed = amount / surplus
                if months_needed <= 1:
                    answer = f"Yes - {m(amount)} fits within one month's surplus of {m(surplus)}, but it would wipe out this month's savings."
                else:
                    answer = (f"{m(amount)} is about {months_needed:.1f} months of your current surplus ({m(surplus)}/month). "
                              f"Save {m(amount / max(2, round(months_needed)))} a month toward it instead of buying on credit.")
        elif intent == "category" and category:
            cur = spend.get(category, 0) / months
            rec = recommended.get(category)
            if cur == 0:
                answer = f"You have no {category} spending in this data."
            elif category in cuts:
                answer = (f"You spend {m(cur)}/month on {category}. My recommended limit is {m(rec)}, "
                          f"saving {m(cuts[category])}/month - the budget search picked it as one of the easiest cuts.")
            else:
                answer = f"You spend {m(cur)}/month on {category}, which is within your plan - no cut needed there."
        elif intent == "save":
            if cuts:
                parts = ", ".join(f"{c} by {m(a)}" for c, a in sorted(cuts.items(), key=lambda kv: -kv[1]))
                answer = f"Cut {parts} - that adds {m(sum(cuts.values()))}/month and reaches your savings target with the least disruption."
            else:
                answer = f"You already meet your savings target ({m(surplus)}/month). Automate it and invest the surplus."
        elif intent == "invest":
            if investment_plan.get("investable_surplus", 0) > 0:
                answer = " ".join(f"{s['title']}: {s['detail']}" for s in investment_plan["steps"][:3])
                answer += " (Educational guidance, not personalised advice.)"
            else:
                answer = "Get your monthly spending below income first - investing with a deficit means borrowing to invest."
        elif intent == "fraud":
            flagged = anomalies.get("flagged_transactions", [])
            answer = (" ".join(anomalies.get("alert_messages", [])) if flagged
                      else "No suspicious transactions found - all amounts are consistent with your normal pattern.")
        elif intent == "forecast":
            if prediction.get("predicted_expense"):
                answer = (f"Next month ({prediction.get('next_month')}) is forecast at {m(prediction['predicted_expense'])}, "
                          f"trend {prediction.get('trend_direction', 'Stable').lower()}, using {prediction.get('prediction_method')} "
                          f"with {prediction.get('confidence', 0):.0f}% confidence.")
            else:
                answer = "I need at least one month of transactions to forecast."
        elif intent == "budget":
            alloc = budget_plan.get("budget_allocation", {})
            answer = (f"Your 50/30/20 plan on {m(monthly_income)}: Needs {m(alloc.get('needs_budget', 0))}, "
                      f"Wants {m(alloc.get('wants_budget', 0))}, Savings {m(alloc.get('savings_budget', 0))}.")
        else:
            answer = (f"Your budget health score is {budget_plan.get('budget_health_score', 0):.0f}/100 with a savings rate of "
                      f"{budget_plan.get('savings_rate', 0):.1f}%. Biggest spend: {expense_analysis.get('highest_expense_category') or 'n/a'}.")

        return {"query": query, "intent": intent, "entities": {"category": category, "amount": amount}, "answer": answer}
