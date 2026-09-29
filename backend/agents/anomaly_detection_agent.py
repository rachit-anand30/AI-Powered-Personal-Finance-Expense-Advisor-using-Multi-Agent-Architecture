import numpy as np
from scipy import stats
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

class AnomalyDetectionAgent:
    """Agent for detecting fraudulent or anomalous transactions using Z-Score and Isolation Forest."""

    def calculate_zscore(self, amounts: List[float]) -> List[float]:
        """Calculate z-scores for a list of transaction amounts."""
        if len(amounts) < 3 or len(set(amounts)) == 1:
            return [0.0] * len(amounts)
        
        z_scores = stats.zscore(amounts)
        return z_scores.tolist()

    def detect_anomalies_zscore(self, transactions: List[Dict[str, Any]], threshold: float = 2.5) -> List[Dict[str, Any]]:
        """Detect anomalies using Z-score method."""
        if not transactions:
            return []
        amounts = [t["amount"] for t in transactions]
        z_scores = self.calculate_zscore(amounts)
        
        anomalies = []
        for t, z in zip(transactions, z_scores):
            if abs(z) > threshold:
                t_copy = dict(t)
                t_copy["z_score"] = float(z)
                anomalies.append(t_copy)
                
        return anomalies

    def detect_anomalies_isolation_forest(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect anomalies using Isolation Forest."""
        if len(transactions) < 4:
            return []
        
        amounts = np.array([t["amount"] for t in transactions]).reshape(-1, 1)
        
        # Train Isolation Forest
        clf = IsolationForest(contamination=0.1, random_state=42)
        preds = clf.fit_predict(amounts)
        
        anomalies = []
        for i, pred in enumerate(preds):
            if pred == -1:
                anomalies.append(transactions[i])
                
        return anomalies

    def detect_all_anomalies(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Combine results from both anomaly detection methods."""
        if not transactions:
            return {
                "flagged_transactions": [],
                "alert_messages": [],
                "risk_level": "Low"
            }
            
        zscore_anomalies = self.detect_anomalies_zscore(transactions)
        if_anomalies = self.detect_anomalies_isolation_forest(transactions)
        
        # Combine unique anomalies by a unique identifier or index (simplified by object id if dicts are same)
        # Using a simple list comprehension, ensuring no duplicates by checking descriptions/amounts/dates
        combined = []
        seen = set()
        for a in zscore_anomalies + if_anomalies:
            sig = f"{a['date']}_{a['description']}_{a['amount']}"
            if sig not in seen:
                seen.add(sig)
                combined.append(a)
                
        alert_messages = []
        for t in combined:
            z_val = t.get("z_score", "N/A")
            cat = t.get("category", "Unknown")
            z_str = f" (Z-score: {z_val:.2f})" if isinstance(z_val, float) else ""
            alert_messages.append(f"Unusual transaction detected: {cat} ₹{t['amount']}{z_str}")
            
        risk_level = "Low"
        if len(combined) >= 3:
            risk_level = "High"
        elif len(combined) > 0:
            risk_level = "Medium"
            
        return {
            "flagged_transactions": combined,
            "alert_messages": alert_messages,
            "risk_level": risk_level
        }
