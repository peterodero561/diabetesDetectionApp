import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from catboost import CatBoostClassifier
from pipeline.preprocessing import DiabetesPreprocessor


# load dataset
df = pd.read_csv('data/diabetes.csv')

X = df.drop('Outcome', axis=1)
y = df['Outcome']

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# preprocessing
preprocessor = DiabetesPreprocessor()
preprocessor.fit(X_train)

X_train_scaled = preprocessor.transform(X_train)
X_test_scaled = preprocessor.transform(X_test)

# train model
model = CatBoostClassifier(
    iterations=500, depth=6, learnig_rate=0.03, verbose=0, scale_pos_weight=1.5
)

# save artifacts
joblib.dump(model, 'model/catboost_model.pkl')
preprocessor.save()

print('Model trained and Saved')