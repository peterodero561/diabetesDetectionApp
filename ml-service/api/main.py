from fastapi import FastAPI
from predict import predict_patient

app = FastAPI()

# route to confirm ML Service
@app.get('/')
def root():
    return {'message': 'Diabetes ML Service Runnig'}

# route to predict patient data
@app.post('/predict')
def predict(data: dict):
    result = predict_patient(data)
    return result