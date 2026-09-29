from typing import List, Dict, Any
from .expense_analyzer_agent import ExpenseAnalyzerAgent
from .anomaly_detection_agent import AnomalyDetectionAgent
from .budget_planning_agent import BudgetPlanningAgent
from .prediction_agent import PredictionAgent
from .advisor_agent import AdvisorAgent

class CoordinatorAgent:
    """Central orchestrator for all AI Agents."""

    def __init__(self):
        self.expense_agent = ExpenseAnalyzerAgent()
        self.anomaly_agent = AnomalyDetectionAgent()
        self.budget_agent = BudgetPlanningAgent()
        self.prediction_agent = PredictionAgent()
        self.advisor_agent = AdvisorAgent()

    def process_user_request(self, transactions: List[Dict[str, Any]], monthly_income: float, user_query: str = None, saving_goal: float = None) -> Dict[str, Any]:
        """Orchestrates the entire analysis pipeline across all agents."""
        logs = []
        
        try:
            logs.append("Starting Expense Analysis...")
            expense_analysis = self.expense_agent.analyze_transactions(transactions)
            
            logs.append("Starting Anomaly Detection...")
            anomalies = self.anomaly_agent.detect_all_anomalies(transactions)
            
            logs.append("Starting Budget Planning...")
            budget_plan = self.budget_agent.create_budget(monthly_income, expense_analysis, saving_goal)
            
            logs.append("Running Expense Prediction...")
            predictions = self.prediction_agent.predict_future_expenses(transactions, monthly_income)
            
            logs.append("Generating Financial Advice...")
            advice = self.advisor_agent.generate_advice(expense_analysis, budget_plan, predictions, anomalies, user_query)
            
            logs.append("All agents completed successfully.")
            
            return {
                "expense_analysis": expense_analysis,
                "anomalies": anomalies,
                "budget_plan": budget_plan,
                "predictions": predictions,
                "advice": advice,
                "logs": logs
            }
            
        except Exception as e:
            logs.append(f"Error during agent execution: {str(e)}")
            # Return partial or empty data with the error log
            return {
                "error": str(e),
                "logs": logs
            }
