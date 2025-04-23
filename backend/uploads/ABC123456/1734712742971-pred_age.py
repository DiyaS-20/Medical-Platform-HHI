import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error
import joblib
import json
# Assuming the cleaned dataset with life expectancy is loaded as 'data'

def train_and_save_models(data):
    # Define features and target variables
    X = data.drop(columns=["HbA1c_level", "blood_glucose_level", "life_expectancy"])
    y_health_score = data["HbA1c_level"]  # Using HbA1c_level as a proxy for health score
    y_life_expectancy = data["life_expectancy"]  # Using the new life expectancy column as target

    # Save the column order for prediction consistency
    required_columns = list(X.columns)
    with open("required_columns.json", "w") as f:
        json.dump(required_columns, f)

    # Split data into training and testing sets
    X_train_h, X_test_h, y_train_h, y_test_h = train_test_split(
        X, y_health_score, test_size=0.2, random_state=42
    )
    X_train_l, X_test_l, y_train_l, y_test_l = train_test_split(
        X, y_life_expectancy, test_size=0.2, random_state=42
    )

    # Define pipelines for training
    health_score_model = Pipeline([
        ("scaler", StandardScaler()),
        ("regressor", RandomForestRegressor(n_estimators=100, random_state=42))
    ])

    life_expectancy_model = Pipeline([
        ("scaler", StandardScaler()),
        ("regressor", RandomForestRegressor(n_estimators=100, random_state=42))
    ])

    # Train the models
    health_score_model.fit(X_train_h, y_train_h)
    life_expectancy_model.fit(X_train_l, y_train_l)

    # Evaluate the models
    health_score_pred = health_score_model.predict(X_test_h)
    life_expectancy_pred = life_expectancy_model.predict(X_test_l)

    health_score_rmse = np.sqrt(mean_squared_error(y_test_h, health_score_pred))
    life_expectancy_rmse = np.sqrt(mean_squared_error(y_test_l, life_expectancy_pred))

    print(f"Health Score RMSE: {health_score_rmse}")
    print(f"Life Expectancy RMSE: {life_expectancy_rmse}")

    # Save the models
    joblib.dump(health_score_model, "health_score_model.pkl")
    joblib.dump(life_expectancy_model, "life_expectancy_model.pkl")
    print("Models and required columns saved successfully.")

def predict_real_time():
    # Load models
    health_score_model = joblib.load("health_score_model.pkl")
    life_expectancy_model = joblib.load("life_expectancy_model.pkl")

    # Load required columns
    with open("required_columns.json", "r") as f:
        required_columns = json.load(f)

    # Collect real-time input
    print("Enter the following details for prediction:")
    input_data = {
        "sex": [int(input("Gender (0 for Male, 1 for Female): "))],
        "age": [float(input("Age (in years): "))],
        "hypertension": [int(input("Hypertension (0 for No, 1 for Yes): "))],
        "heart_disease": [int(input("Heart Disease (0 for No, 1 for Yes): "))],
        "current_smoker": [int(input("Smoker (0 for Non-smoker, 1 for Smoker): "))],
        "bmi": [float(input("BMI: "))],
        "diabetes": [int(input("Diabetes (0 for No, 1 for Yes): "))]
    }

    # Convert input to DataFrame
    input_df = pd.DataFrame(input_data)

    # Align columns with training data
    for col in required_columns:
        if col not in input_df:
            input_df[col] = 0
    input_df = input_df[required_columns]

    # Debugging: Check column alignment
    print(f"Input DataFrame for prediction:\n{input_df}")
    print(f"Columns in input DataFrame: {list(input_df.columns)}")

    # Predict health score and life expectancy
    predicted_health_score = health_score_model.predict(input_df)[0]
    predicted_life_expectancy = life_expectancy_model.predict(input_df)[0]

    print(f"Predicted Health Score (HbA1c Level): {predicted_health_score}")
    print(f"Predicted Life Expectancy (Years): {predicted_life_expectancy}")

if __name__ == "__main__":
    # Example dataset loading
    try:
        cleaned_data = pd.read_csv("cleaned_dataset_with_life_expectancy.csv")  # Replace with the updated dataset path
        print("Dataset loaded successfully.")

        # Train and save models
        train_and_save_models(cleaned_data)

        # Test real-time prediction
        predict_real_time()
    except FileNotFoundError:
        print("Dataset not found. Please ensure the 'cleaned_dataset_with_life_expectancy.csv' file is available.")
    except Exception as e:
        print(f"An error occurred: {e}")
