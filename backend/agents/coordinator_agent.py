import time
from typing import List, Dict, Any, Callable
from .expense_analyzer_agent import ExpenseAnalyzerAgent
from .anomaly_detection_agent import AnomalyDetectionAgent
from .budget_planning_agent import BudgetPlanningAgent
from .prediction_agent import PredictionAgent
from .investment_agent import InvestmentAgent
from .advisor_agent import AdvisorAgent


class CoordinatorAgent:
    """Central orchestrator for all AI agents (blackboard architecture).

    Every agent reads what it needs from a shared blackboard and writes its result back.
    The coordinator runs them in dependency order and records:
      - trace:    one entry per agent (inputs consumed, summary of output, runtime)
      - messages: explicit hand-offs between agents (who told whom what)
    """

    PIPELINE = [
        # (key,            display name,          reads from)
        ("expense_analysis", "Expense Analyzer",  ["transactions", "monthly_income"]),
        ("anomalies",        "Anomaly Detection", ["transactions", "expense_analysis"]),
        ("budget_plan",      "Budget Planner",    ["expense_analysis", "anomalies", "monthly_income", "saving_goal"]),
        ("predictions",      "Prediction",        ["transactions", "anomalies", "monthly_income"]),
        ("investment_plan",  "Investment",        ["budget_plan", "predictions", "anomalies"]),
        ("advice",           "Advisor",           ["expense_analysis", "budget_plan", "predictions", "anomalies", "investment_plan", "user_query"]),
    ]

    def __init__(self):
        self.expense_agent = ExpenseAnalyzerAgent()
        self.anomaly_agent = AnomalyDetectionAgent()
        self.budget_agent = BudgetPlanningAgent()
        self.prediction_agent = PredictionAgent()
        self.investment_agent = InvestmentAgent()
        self.advisor_agent = AdvisorAgent()

    @staticmethod
    def _signature(t: Dict[str, Any]) -> str:
        return f"{t['date']}_{t['description']}_{t['amount']}"

    def _runners(self, bb: Dict[str, Any]) -> Dict[str, Callable[[], Dict[str, Any]]]:
        return {
            "expense_analysis": lambda: self.expense_agent.analyze_transactions(bb["transactions"], bb["monthly_income"]),
            "anomalies": lambda: self.anomaly_agent.detect_all_anomalies(bb["transactions"], bb["monthly_income"]),
            "budget_plan": lambda: self.budget_agent.create_budget(bb["monthly_income"], bb["expense_analysis"], bb["saving_goal"], bb["anomalies"]),
            "predictions": lambda: self.prediction_agent.predict_future_expenses(
                bb["transactions"], bb["monthly_income"],
                exclude_signatures={self._signature(a) for a in bb["anomalies"]["flagged_transactions"]}),
            "investment_plan": lambda: self.investment_agent.create_investment_plan(
                bb["monthly_income"], bb["budget_plan"], bb["predictions"], bb["anomalies"],
                bb["expense_analysis"].get("investments_total", 0.0) / max(1, bb["expense_analysis"].get("months_covered") or 1)),
            "advice": lambda: self.advisor_agent.generate_advice(
                bb["expense_analysis"], bb["budget_plan"], bb["predictions"], bb["anomalies"], bb["user_query"],
                bb["transactions"], bb["monthly_income"], bb["investment_plan"]),
        }

    def _summarise(self, key: str, out: Dict[str, Any], bb: Dict[str, Any]) -> str:
        if key == "expense_analysis":
            ml = sum(1 for t in bb["transactions"] if t.get("category_source") == "ml")
            return (f"Categorised {len(bb['transactions'])} transactions ({ml} by ML model) into "
                    f"{len(out['category_wise_spending'])} categories; ₹{out['monthly_total']:,.0f}/month, risk {out['risk_level']}")
        if key == "anomalies":
            n = len(out["flagged_transactions"])
            return f"{n} {'anomaly' if n == 1 else 'anomalies'} flagged, risk {out['risk_level']}"
        if key == "budget_plan":
            opt = out["optimization"]
            return (f"Health {out['budget_health_score']:.0f}/100, savings rate {out['savings_rate']:.1f}%; "
                    f"search expanded {opt['nodes_expanded']} nodes, found ₹{opt['total_saved']:,.0f}/month of cuts")
        if key == "predictions":
            return f"{out['prediction_method']}: ₹{out['predicted_expense']:,.0f} next month ({out['confidence']:.0f}% conf), {out['trend_direction']}"
        if key == "investment_plan":
            return f"{out['risk_profile']} profile, ₹{out['investable_surplus']:,.0f}/month investable"
        if key == "advice":
            return f"{len(out['top_recommendations'])} recommendations" + (f", answered '{out['response_to_query']['intent']}' query" if out.get("response_to_query") else "")
        return ""

    def _messages(self, key: str, out: Dict[str, Any], bb: Dict[str, Any]) -> List[Dict[str, str]]:
        """Explicit inter-agent hand-offs produced after each agent finishes."""
        msgs = []
        if key == "expense_analysis":
            msgs.append({"from": "Expense Analyzer", "to": "Anomaly Detection", "content": "Transactions are labelled - Investments excluded from fraud checks."})
            msgs.append({"from": "Expense Analyzer", "to": "Budget Planner", "content": f"Monthly spend by category across {out['months_covered']} month(s)."})
        elif key == "anomalies" and out["flagged_transactions"]:
            total = sum(a["amount"] for a in out["flagged_transactions"])
            msgs.append({"from": "Anomaly Detection", "to": "Budget Planner", "content": f"Set aside ₹{total:,.0f} of unverified charges when planning."})
            msgs.append({"from": "Anomaly Detection", "to": "Prediction", "content": f"Exclude {len(out['flagged_transactions'])} one-off transaction(s) worth ₹{total:,.0f} from the forecast."})
            msgs.append({"from": "Anomaly Detection", "to": "Advisor", "content": "Raise a high-priority fraud alert."})
        elif key == "budget_plan":
            msgs.append({"from": "Budget Planner", "to": "Investment", "content": f"Monthly surplus is ₹{out['actual_allocation']['savings']:,.0f}."})
            if out["optimization"]["cuts"]:
                msgs.append({"from": "Budget Planner", "to": "Advisor", "content": f"Recommend cuts in {', '.join(out['optimization']['cuts'])}."})
        elif key == "predictions":
            msgs.append({"from": "Prediction", "to": "Investment", "content": f"Forecast risk is {out['risk_level']}."})
        elif key == "investment_plan":
            msgs.append({"from": "Investment", "to": "Advisor", "content": f"Suggest a {out['risk_profile']} plan."})
        return msgs

    def process_user_request(self, transactions: List[Dict[str, Any]], monthly_income: float, user_query: str = None, saving_goal: float = None) -> Dict[str, Any]:
        """Orchestrates the entire analysis pipeline across all agents."""
        bb: Dict[str, Any] = {
            "transactions": transactions,
            "monthly_income": monthly_income,
            "user_query": user_query,
            "saving_goal": saving_goal,
        }
        logs, trace, messages = [], [], []
        runners = self._runners(bb)
        pipeline_start = time.perf_counter()

        for key, name, reads in self.PIPELINE:
            logs.append(f"[Coordinator] Dispatching {name} agent...")
            start = time.perf_counter()
            try:
                bb[key] = runners[key]()
            except Exception as e:
                logs.append(f"[{name}] Error: {e}")
                trace.append({"agent": name, "status": "error", "reads": reads, "summary": str(e),
                              "duration_ms": round((time.perf_counter() - start) * 1000, 2)})
                return {"error": f"{name} agent failed: {e}", "logs": logs, "trace": trace, "messages": messages}
            duration = round((time.perf_counter() - start) * 1000, 2)
            summary = self._summarise(key, bb[key], bb)
            logs.append(f"[{name}] {summary} ({duration} ms)")
            trace.append({"agent": name, "status": "ok", "reads": reads, "writes": key, "summary": summary, "duration_ms": duration})
            messages.extend(self._messages(key, bb[key], bb))

        logs.append(f"[Coordinator] All {len(self.PIPELINE)} agents completed in {round((time.perf_counter() - pipeline_start) * 1000, 1)} ms.")

        return {
            "expense_analysis": bb["expense_analysis"],
            "anomalies": bb["anomalies"],
            "budget_plan": bb["budget_plan"],
            "predictions": bb["predictions"],
            "investment_plan": bb["investment_plan"],
            "advice": bb["advice"],
            "categorized_transactions": transactions,
            "logs": logs,
            "trace": trace,
            "messages": messages,
        }
