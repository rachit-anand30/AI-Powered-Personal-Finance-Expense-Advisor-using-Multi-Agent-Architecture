"""ML expense classifier: NLP on transaction descriptions.

Pipeline: text normalisation -> TF-IDF (word 1-2 grams + character 2-5 grams) -> Logistic Regression.
Character n-grams make the model robust to the noise in real statements ("SWIGY*ORDER", "UPI/zomato@hdfc")
and let it generalise to merchants it has never seen by their sub-word shape.

The model trains in well under a second on startup from backend/data/training_transactions.csv.
If scikit-learn is unavailable the service reports itself as not ready and the
Expense Analyzer falls back to keyword rules.
"""
import csv
import logging
import re
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

try:
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import StratifiedKFold, cross_val_score
    from sklearn.pipeline import Pipeline, FeatureUnion
    HAS_SKLEARN = True
except (ImportError, Exception):
    HAS_SKLEARN = False

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TRAINING_FILE = DATA_DIR / "training_transactions.csv"
HOLDOUT_FILE = DATA_DIR / "classifier_test_set.csv"   # hand-labelled, merchants/phrasings unseen in training


def normalise(text: str) -> str:
    """Lower-case, drop reference numbers / UPI handles noise, collapse punctuation."""
    text = (text or "").lower()
    text = re.sub(r"@[a-z]+", " ", text)          # UPI bank handle: zomato@okaxis -> zomato
    text = re.sub(r"\d+", " ", text)              # order / reference numbers
    text = re.sub(r"[^a-z&]+", " ", text)          # punctuation, slashes, asterisks
    return re.sub(r"\s+", " ", text).strip()


class MLService:
    """Trains and serves the transaction-description classifier."""

    def __init__(self):
        self.model = None
        self.classes: List[str] = []
        self.info: Dict[str, Any] = {"ready": False}

    @staticmethod
    def _load(path: Path) -> Tuple[List[str], List[str]]:
        with open(path, encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        return [normalise(r["description"]) for r in rows], [r["category"] for r in rows]

    def _build_pipeline(self):
        features = FeatureUnion([
            ("words", TfidfVectorizer(analyzer="word", ngram_range=(1, 2), sublinear_tf=True)),
            ("chars", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True)),
        ])
        return Pipeline([("tfidf", features), ("clf", LogisticRegression(C=10, max_iter=2000))])

    def train(self) -> Dict[str, Any]:
        if not HAS_SKLEARN:
            self.info = {"ready": False, "reason": "scikit-learn not installed"}
            return self.info
        if not TRAINING_FILE.exists():
            self.info = {"ready": False, "reason": f"training file missing: {TRAINING_FILE.name}"}
            return self.info

        start = time.perf_counter()
        X, y = self._load(TRAINING_FILE)
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(self._build_pipeline(), X, y, cv=cv)

        self.model = self._build_pipeline().fit(X, y)
        self.classes = [str(c) for c in self.model.classes_]
        holdout_acc = None
        if HOLDOUT_FILE.exists():
            hx, hy = self._load(HOLDOUT_FILE)
            holdout_acc = round(float(np.mean(self.model.predict(hx) == np.array(hy))) * 100, 2)
        self.info = {
            "ready": True,
            "algorithm": "TF-IDF (word 1-2 + char 2-5 grams) + Logistic Regression",
            "training_samples": len(X),
            "categories": self.classes,
            "cv_accuracy": round(float(np.mean(cv_scores)) * 100, 2),
            "cv_folds": 5,
            "holdout_accuracy": holdout_acc,
            "train_time_ms": round((time.perf_counter() - start) * 1000, 1),
        }
        logger.info("Expense classifier trained: %s", self.info)
        return self.info

    def ensure_trained(self):
        if not self.info.get("ready") and "reason" not in self.info:
            self.train()

    def predict(self, description: str) -> Optional[Tuple[str, float]]:
        """Return (category, probability) or None when the model is unavailable."""
        self.ensure_trained()
        if self.model is None:
            return None
        text = normalise(description)
        if not text:
            return None
        probs = self.model.predict_proba([text])[0]
        best = int(np.argmax(probs))
        return self.classes[best], float(probs[best])


ml_service = MLService()
