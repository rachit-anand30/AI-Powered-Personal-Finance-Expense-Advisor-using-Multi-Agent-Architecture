import re
import numpy as np
from scipy import stats
try:
    from sklearn.ensemble import IsolationForest
    HAS_ISOLATION_FOREST = True
except (ImportError, Exception):
    HAS_ISOLATION_FOREST = False
from typing import List, Dict, Any, Optional


class AnomalyDetectionAgent:
    """Agent for detecting fraudulent or anomalous transactions.

    Three detectors vote on every transaction:
      1. Modified Z-score (median/MAD) - the primary, outlier-robust detector
      2. Classic Z-score (mean/std)
      3. Isolation Forest (sklearn), with an IQR fence as fallback
    A transaction is flagged when the robust detector fires; the other two add confidence.
    Expected spending is never flagged: scheduled commitments (rent, EMI, SIP...) and recurring
    merchants (seen in 2+ months at a similar amount, e.g. the monthly grocery run).
    """

    FIXED_COMMITMENTS = re.compile(r"\b(rent|emi|loan|insurance|sip|mutual funds?|tuition|fees|salary)\b", re.IGNORECASE)
    MODIFIED_Z_THRESHOLD = 3.5   # Iglewicz & Hoaglin recommended cut-off
    MIN_MEDIAN_MULTIPLE = 5.0    # must also be at least 5x a typical transaction

    def calculate_zscore(self, amounts: List[float]) -> List[float]:
        """Calculate z-scores for a list of transaction amounts."""
        if len(amounts) < 3 or len(set(amounts)) == 1:
            return [0.0] * len(amounts)
        return stats.zscore(amounts).tolist()

    def calculate_modified_zscore(self, amounts: List[float]) -> List[float]:
        """Robust z-score using the median absolute deviation (not skewed by the outlier itself)."""
        if len(amounts) < 3:
            return [0.0] * len(amounts)
        arr = np.array(amounts, dtype=float)
        median = np.median(arr)
        mad = np.median(np.abs(arr - median))
        if mad == 0:
            mad = np.mean(np.abs(arr - median)) or 1.0
        return (0.6745 * (arr - median) / mad).tolist()

    def detect_anomalies_zscore(self, transactions: List[Dict[str, Any]], threshold: float = 2.5) -> List[Dict[str, Any]]:
        """Detect anomalies using the classic Z-score method."""
        if not transactions:
            return []
        z_scores = self.calculate_zscore([t["amount"] for t in transactions])
        anomalies = []
        for t, z in zip(transactions, z_scores):
            if abs(z) > threshold:
                anomalies.append({**t, "z_score": float(z)})
        return anomalies

    def detect_anomalies_isolation_forest(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect anomalies using Isolation Forest with IQR fallback."""
        if len(transactions) < 4:
            return []

        amounts = np.array([t["amount"] for t in transactions]).reshape(-1, 1)

        if HAS_ISOLATION_FOREST:
            try:
                clf = IsolationForest(contamination="auto", random_state=42)
                preds = clf.fit_predict(amounts)
                return [transactions[i] for i, pred in enumerate(preds) if pred == -1]
            except Exception:
                pass

        # IQR fallback method
        raw_amounts = [t["amount"] for t in transactions]
        q25, q75 = np.percentile(raw_amounts, [25, 75])
        upper_bound = q75 + 1.5 * (q75 - q25)
        return [t for t in transactions if t["amount"] > upper_bound]

    @staticmethod
    def _merchant(description: str) -> str:
        return re.sub(r"[^a-z]+", " ", description.lower()).strip()

    def recurring_signatures(self, transactions: List[Dict[str, Any]]) -> set:
        """Transactions from merchants seen in 2+ distinct months, within 1.5x of that merchant's median."""
        by_merchant: Dict[str, List[Dict[str, Any]]] = {}
        for t in transactions:
            by_merchant.setdefault(self._merchant(t.get("description", "")), []).append(t)
        recurring = set()
        for txns in by_merchant.values():
            if len({str(t["date"])[:7] for t in txns}) < 2:
                continue
            median = float(np.median([t["amount"] for t in txns]))
            recurring.update(self._signature(t) for t in txns if t["amount"] <= 1.5 * median)
        return recurring

    @staticmethod
    def _signature(t: Dict[str, Any]) -> str:
        return f"{t['date']}_{t['description']}_{t['amount']}"

    def detect_all_anomalies(self, transactions: List[Dict[str, Any]], monthly_income: Optional[float] = None) -> Dict[str, Any]:
        """Combine the detectors into a single list of flagged transactions."""
        recurring = self.recurring_signatures(transactions)
        candidates = [
            t for t in transactions
            if float(t.get("amount", 0)) > 0
            and t.get("category") != "Investments"
            and not self.FIXED_COMMITMENTS.search(t.get("description", ""))
        ]
        # Recurring payments still shape the baseline, but can never be flagged themselves
        flaggable = {self._signature(t) for t in candidates} - recurring
        if len(candidates) < 3:
            return {"flagged_transactions": [], "alert_messages": [], "risk_level": "Low"}

        amounts = [float(t["amount"]) for t in candidates]
        median = float(np.median(amounts))
        mod_z = self.calculate_modified_zscore(amounts)
        z_all = self.calculate_zscore(amounts)
        zscore_hits = {self._signature(a) for a in self.detect_anomalies_zscore(candidates)}
        forest_hits = {self._signature(a) for a in self.detect_anomalies_isolation_forest(candidates)}

        flagged = []
        for t, z, mz in zip(candidates, z_all, mod_z):
            sig = self._signature(t)
            if sig not in flaggable or mz <= self.MODIFIED_Z_THRESHOLD or t["amount"] < self.MIN_MEDIAN_MULTIPLE * median:
                continue
            methods = ["Modified Z-score"]
            if sig in zscore_hits:
                methods.append("Z-score")
            if sig in forest_hits:
                methods.append("Isolation Forest")
            flagged.append({
                **t,
                "z_score": round(float(z), 2),
                "modified_z_score": round(float(mz), 2),
                "times_typical": round(t["amount"] / median, 1) if median else None,
                "detected_by": methods,
                "confidence": round(len(methods) / 3 * 100),
            })

        flagged.sort(key=lambda a: a["amount"], reverse=True)
        alert_messages = [
            f"Unusual transaction: {a['description']} ₹{a['amount']:,.0f} on {a['date']} "
            f"is {a['times_typical']}x your typical spend (flagged by {', '.join(a['detected_by'])})."
            for a in flagged
        ]

        biggest = flagged[0]["amount"] if flagged else 0
        if len(flagged) >= 3 or (monthly_income and biggest > 0.5 * monthly_income):
            risk_level = "High"
        elif flagged:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        return {"flagged_transactions": flagged, "alert_messages": alert_messages, "risk_level": risk_level}
