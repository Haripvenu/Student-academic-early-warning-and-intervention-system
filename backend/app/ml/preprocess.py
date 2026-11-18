"""
Preprocessing Pipeline for Academic Risk Monitor.
Fits imputation and scaling on training cohort features, preserving missingness flags.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from .feature_spec import ML_FEATURE_COLUMNS

class PreprocessingPipeline:
    def __init__(self, feature_cols: List[str] = ML_FEATURE_COLUMNS):
        self.feature_cols = feature_cols
        self.imputer = SimpleImputer(strategy="median")
        self.scaler = StandardScaler()
        self.feature_medians: Dict[str, float] = {}
        self.is_fitted = False

    def fit(self, df: pd.DataFrame):
        X = df[self.feature_cols].copy()
        self.imputer.fit(X)
        
        # Save reference medians for explainability substitution
        for col, med in zip(self.feature_cols, self.imputer.statistics_):
            self.feature_medians[col] = float(med)
            
        X_imputed = self.imputer.transform(X)
        self.scaler.fit(X_imputed)
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("PreprocessingPipeline is not fitted yet.")
        X = df[self.feature_cols].copy()
        X_imputed = self.imputer.transform(X)
        return self.scaler.transform(X_imputed)

    def fit_transform(self, df: pd.DataFrame) -> np.ndarray:
        self.fit(df)
        return self.transform(df)

    def transform_single(self, features_dict: Dict[str, Any]) -> np.ndarray:
        df = pd.DataFrame([features_dict])
        return self.transform(df)
