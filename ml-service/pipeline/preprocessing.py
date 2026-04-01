import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = [
    'Pregnancies',
    'Glucose',
    'BloodPressure',
    'SkinThickness',
    'Insulin',
    'BMI',
    'DiabetesPedigreeFunction',
    'Age'
]

class DiabetesPreprocessor:
    '''Preprocessing of data from api'''
    def __init__(self):
        self.scaler = StandardScaler()

    def fit(self, X):
        '''Scale the column features'''
        X = X[FEATURE_COLUMNS]
        self.scaler.fit(X)

    def transform(self, data):
        '''data transformation'''
        if isinstance(data, dict):
            data = pd.DataFrame([data])

        # enforce column order
        data = data.reindex(columns=FEATURE_COLUMNS)

        # fill missing
        data = data.fillna(data.mean())

        return self.scaler.transform(data)
    
    def save(self, path='model/scaler.pkl'):
        joblib.dump(self.scaler, path)

    def load(self, path='model/scaler.pkl'):
        self.scaler = joblib.load(path)