import joblib
from pipeline.preprocessing import DiabetesPreprocessor

model = joblib.load('model/catboost_model.pkl')

preprocessor = DiabetesPreprocessor
preprocessor.load()

def predict_patient(data):
    features = preprocessor.transform(data)

    prob = model.predict_proba(features)[0][1]
    pred = int(prob > 0.5)

    return {
        'prediction': pred,
        'probability': float(prob)
    }