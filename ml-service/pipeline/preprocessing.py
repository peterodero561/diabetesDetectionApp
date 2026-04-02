import pandas as pd
import numpy as np
import joblib

class DiabetesPreprocessor:
    def __init__(self):
        self.scaler = None
        self.feature_columns = None
        self.log_columns = None

    def load(self, #scaler_path='model/scaler.pkl', 
             features_path='model/feature_names.pkl',
             log_cols_path='model/log_columns.pkl'):
        #self.scaler = joblib.load(scaler_path)
        self.feature_columns = joblib.load(features_path)
        self.log_columns = joblib.load(log_cols_path)

    def transform(self, data):
        if isinstance(data, dict):
            data = pd.DataFrame([data])

        # Apply log transformation to specified columns
        data = data.copy()
        for col in self.log_columns:
            if col in data.columns:
                data[col] = np.log1p(data[col])  # log(1+x) to handle zeros

        # Reorder columns to match training order
        data = data.reindex(columns=self.feature_columns, fill_value=0)

        # Fill missing values (optional, use training median if needed)
        data = data.fillna(data.mean())

        # Scale
        return data.values