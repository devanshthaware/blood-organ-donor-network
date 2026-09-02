# ML Inference API - Blood Donation Management System

A FastAPI-based machine learning inference service for blood donation management, providing predictions for donor reliability, blood demand forecasting, and donor availability.

## 🎯 Features

- **Donor Reliability Prediction**: Predicts the reliability score of donors based on historical donation patterns
- **Blood Demand Forecasting**: Forecasts blood demand probability using classification models
- **Donor Availability Prediction**: Predicts the probability of donor availability for donation requests
- **RESTful API**: Clean, well-documented API endpoints with automatic OpenAPI/Swagger documentation
- **Model Caching**: Efficient model loading with in-memory caching for improved performance

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Models](#models)
- [Testing](#testing)
- [Dependencies](#dependencies)

## 🚀 Installation

### Prerequisites

- Python 3.8+
- pip or conda

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ml_backend
```

2. Install dependencies:
```bash
pip install fastapi uvicorn pandas scikit-learn joblib pydantic
```

Or using conda:
```bash
conda install fastapi uvicorn pandas scikit-learn joblib pydantic
```

3. Ensure model files are present in `ml_inference/models/`:
   - `donor_reliability_model.joblib`
   - `demand_forecasting_model.joblib`
   - `donor_availability_model.joblib`

## 🏃 Quick Start

1. Start the API server:
```bash
python -m uvicorn ml_inference.api.main:app --reload
```

2. Access the API documentation:
   - Swagger UI: http://127.0.0.1:8000/docs
   - ReDoc: http://127.0.0.1:8000/redoc

3. Test the health endpoint:
```bash
curl http://127.0.0.1:8000/health
```

## 📚 API Documentation

### Base URL
```
http://127.0.0.1:8000
```

### Endpoints

#### 1. Health Check
**GET** `/health`

Check if the API is running and models are loaded.

**Response:**
```json
{
  "status": "ok",
  "models_loaded": true
}
```

#### 2. Predict Donor Reliability
**POST** `/predict/reliability`

Predicts the reliability score of a donor based on historical data.

**Request Body:**
```json
{
  "total_requests": 40,
  "accepted_requests": 35,
  "completed_donations": 30,
  "no_shows": 5,
  "avg_response_time_minutes": 18.5
}
```

**Response:**
```json
{
  "reliability_score": 0.85
}
```

**Field Descriptions:**
- `total_requests`: Total number of donation requests sent to the donor
- `accepted_requests`: Number of requests accepted by the donor
- `completed_donations`: Number of donations actually completed
- `no_shows`: Number of times donor didn't show up
- `avg_response_time_minutes`: Average response time in minutes

#### 3. Predict Blood Demand
**POST** `/predict/demand`

Forecasts the probability of high blood demand for a given region and blood group.

**Request Body:**
```json
{
  "region": 1,
  "blood_group": 3,
  "demand_units": 120,
  "supply_units": 90,
  "month": 7,
  "day": 15
}
```

**Response:**
```json
{
  "predicted_demand": 0.75
}
```

**Field Descriptions:**
- `region`: Encoded region identifier (integer)
- `blood_group`: Encoded blood group identifier (integer)
- `demand_units`: Current demand in units
- `supply_units`: Current supply in units
- `month`: Month of the year (1-12)
- `day`: Day of the month (1-31)

**Note:** Returns the probability (0.0 to 1.0) of high demand. Higher values indicate higher demand probability.

#### 4. Predict Donor Availability
**POST** `/predict/availability`

Predicts the probability that a donor will be available for a donation request.

**Request Body:**
```json
{
  "blood_group": 2,
  "distance_km": 8.5,
  "days_since_last_donation": 60,
  "past_acceptance_rate": 0.75,
  "urgency_level": 2,
  "time_of_day": 1
}
```

**Response:**
```json
{
  "availability_probability": 0.7087
}
```

**Field Descriptions:**
- `blood_group`: Encoded blood group identifier (integer)
- `distance_km`: Distance to donation center in kilometers
- `days_since_last_donation`: Days since last donation
- `past_acceptance_rate`: Historical acceptance rate (0.0 to 1.0)
- `urgency_level`: Urgency level of the request (encoded integer)
- `time_of_day`: Time of day identifier (encoded integer)

## 💡 Usage Examples

### Python Example

```python
import requests

# Base URL
BASE_URL = "http://127.0.0.1:8000"

# Predict reliability
reliability_data = {
    "total_requests": 40,
    "accepted_requests": 35,
    "completed_donations": 30,
    "no_shows": 5,
    "avg_response_time_minutes": 18.5
}
response = requests.post(f"{BASE_URL}/predict/reliability", json=reliability_data)
print(response.json())
# Output: {"reliability_score": 0.85}

# Predict demand
demand_data = {
    "region": 1,
    "blood_group": 3,
    "demand_units": 120,
    "supply_units": 90,
    "month": 7,
    "day": 15
}
response = requests.post(f"{BASE_URL}/predict/demand", json=demand_data)
print(response.json())
# Output: {"predicted_demand": 0.75}

# Predict availability
availability_data = {
    "blood_group": 2,
    "distance_km": 8.5,
    "days_since_last_donation": 60,
    "past_acceptance_rate": 0.75,
    "urgency_level": 2,
    "time_of_day": 1
}
response = requests.post(f"{BASE_URL}/predict/availability", json=availability_data)
print(response.json())
# Output: {"availability_probability": 0.7087}
```

### cURL Examples

```bash
# Health check
curl http://127.0.0.1:8000/health

# Predict reliability
curl -X POST http://127.0.0.1:8000/predict/reliability \
  -H "Content-Type: application/json" \
  -d '{
    "total_requests": 40,
    "accepted_requests": 35,
    "completed_donations": 30,
    "no_shows": 5,
    "avg_response_time_minutes": 18.5
  }'

# Predict demand
curl -X POST http://127.0.0.1:8000/predict/demand \
  -H "Content-Type: application/json" \
  -d '{
    "region": 1,
    "blood_group": 3,
    "demand_units": 120,
    "supply_units": 90,
    "month": 7,
    "day": 15
  }'

# Predict availability
curl -X POST http://127.0.0.1:8000/predict/availability \
  -H "Content-Type: application/json" \
  -d '{
    "blood_group": 2,
    "distance_km": 8.5,
    "days_since_last_donation": 60,
    "past_acceptance_rate": 0.75,
    "urgency_level": 2,
    "time_of_day": 1
  }'
```

## 📁 Project Structure

```
ml_backend/
├── ml_inference/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   └── schemas.py           # Pydantic request schemas
│   ├── models/
│   │   ├── donor_reliability_model.joblib
│   │   ├── donor_reliability_dataset.csv
│   │   ├── donor_reliability.ipynb
│   │   ├── demand_forecasting_model.joblib
│   │   ├── demand_forecasting_dataset.csv
│   │   ├── demand_forecasting.ipynb
│   │   ├── donor_availability_model.joblib
│   │   ├── donor_availability_dataset.csv
│   │   └── donor_availability.ipynb
│   ├── availability.py          # Availability prediction module
│   ├── demand.py                # Demand forecasting module
│   ├── reliability.py           # Reliability prediction module
│   ├── loader.py                # Model loading utility
│   └── tests/
│       ├── __init__.py
│       ├── test_api.py          # API endpoint tests
│       ├── test_availability.py
│       ├── test_demand.py
│       └── test_reliability.py
└── README.md
```

## 🤖 Models

### 1. Donor Reliability Model
- **Type**: Regression model
- **Input Features**: 
  - `total_requests`, `accepted_requests`, `completed_donations`, `no_shows`, `avg_response_time_minutes`
- **Output**: Reliability score (0.0 to 1.0)
- **File**: `donor_reliability_model.joblib`

### 2. Demand Forecasting Model
- **Type**: Classification model (RandomForestClassifier)
- **Input Features**: 
  - Categorical: `region`, `blood_group`
  - Numerical: `demand_units`, `supply_units`, `month`, `day`
- **Output**: Probability of high demand (0.0 to 1.0)
- **Classes**: ['High', 'Medium', 'Low']
- **File**: `demand_forecasting_model.joblib`

### 3. Donor Availability Model
- **Type**: Classification model
- **Input Features**: 
  - Categorical: `blood_group`, `urgency_level`, `time_of_day`
  - Numerical: `distance_km`, `days_since_last_donation`, `past_acceptance_rate`
- **Output**: Availability probability (0.0 to 1.0)
- **File**: `donor_availability_model.joblib`

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
python -m pytest ml_inference/tests/

# Run specific test file
python -m pytest ml_inference/tests/test_api.py

# Run with verbose output
python -m pytest ml_inference/tests/ -v
```

### Test Coverage

- API endpoint tests (`test_api.py`)
- Module function tests (`test_availability.py`, `test_demand.py`, `test_reliability.py`)

## 📦 Dependencies

### Core Dependencies
- **fastapi** (>=0.128.0): Web framework for building APIs
- **uvicorn** (>=0.40.0): ASGI server for running FastAPI
- **pandas** (>=1.0.0): Data manipulation and analysis
- **scikit-learn** (>=1.0.0): Machine learning library
- **joblib** (>=1.0.0): Model serialization
- **pydantic** (>=2.7.0): Data validation using Python type annotations

### Development Dependencies
- **pytest**: Testing framework

## 🔧 Configuration

### Model Loading
Models are automatically loaded and cached in memory when first accessed using the `loader.py` utility. This ensures:
- Fast subsequent predictions
- Efficient memory usage
- Single model instance per process

### Server Configuration
Default server configuration:
- **Host**: 127.0.0.1
- **Port**: 8000
- **Reload**: Enabled (for development)

To change the host/port:
```bash
python -m uvicorn ml_inference.api.main:app --host 0.0.0.0 --port 8080
```

## 🐛 Error Handling

The API returns appropriate HTTP status codes:
- **200 OK**: Successful prediction
- **422 Unprocessable Entity**: Invalid request data (validation error)
- **500 Internal Server Error**: Model prediction error

Error response format:
```json
{
  "detail": "Error message description"
}
```

## 📝 Notes

- All probability scores are returned as floats between 0.0 and 1.0
- Categorical features (region, blood_group, etc.) are encoded as integers
- Models use sklearn pipelines with preprocessing (OneHotEncoder for categorical features)
- The demand forecasting model returns the probability of "High" demand class

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

[Add your license information here]

## 👥 Authors

[Add author information here]

---

For more information, visit the API documentation at http://127.0.0.1:8000/docs when the server is running.
