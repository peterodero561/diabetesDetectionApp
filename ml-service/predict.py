#import joblib
from pipeline.preprocessing import DiabetesPreprocessor

#model = joblib.load('model/diabetes_model.cbm')

from catboost import CatBoostClassifier
model = CatBoostClassifier()
model.load_model('model/diabetes_model.cbm')

preprocessor = DiabetesPreprocessor()
preprocessor.load()

def predict_patient(data):
    features = preprocessor.transform(data)

    prob = model.predict_proba(features)[0][1]
    pred = int(prob > 0.5)

    return {
        'prediction': pred,
        'probability': float(prob)
    }