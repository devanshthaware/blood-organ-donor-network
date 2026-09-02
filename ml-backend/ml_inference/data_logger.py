"""
Data logger for saving prediction data for continuous learning/retraining.
Saves predictions to CSV files organized by model type.
"""
import csv
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Base directory for storing prediction logs
_BASE_DIR = Path(__file__).resolve().parent
_DATA_DIR = _BASE_DIR / "prediction_logs"

# Ensure data directory exists
_DATA_DIR.mkdir(exist_ok=True)


def save_prediction(model_name: str, input_data: Dict[str, Any], output_data: Dict[str, Any]):
    """
    Save prediction data to CSV file for retraining.
    
    Args:
        model_name: Name of the model (e.g., "availability", "demand", "reliability")
        input_data: Input features used for prediction
        output_data: Model output/prediction results
    """
    try:
        # Create filename with model name and date
        csv_file = _DATA_DIR / f"{model_name}_predictions.csv"
        
        # Combine input and output data
        record = {
            **input_data,
            **output_data,
            "timestamp": datetime.now().isoformat()
        }
        
        # Check if file exists to determine if we need to write headers
        file_exists = csv_file.exists()
        
        # Get all field names (input + output + timestamp)
        fieldnames = list(input_data.keys()) + list(output_data.keys()) + ["timestamp"]
        
        # Append to CSV file
        with open(csv_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            # Write header if file is new
            if not file_exists:
                writer.writeheader()
            
            # Write the record
            writer.writerow(record)
        
        # Also log to standard logger for console output
        logger.info({
            "model": model_name,
            "input": input_data,
            "output": output_data,
            "saved_to": str(csv_file)
        })
        
    except Exception as e:
        # Log error but don't fail the prediction
        logger.error(f"Failed to save prediction data for {model_name}: {str(e)}")


def get_prediction_log_path(model_name: str) -> Path:
    """
    Get the path to the prediction log file for a given model.
    
    Args:
        model_name: Name of the model
        
    Returns:
        Path to the CSV file
    """
    return _DATA_DIR / f"{model_name}_predictions.csv"
