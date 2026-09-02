import joblib
from pathlib import Path

_BASE_DIR = Path(__file__).resolve().parent
_MODELS_DIR = _BASE_DIR / "models"

_loaded_models = {}

def load_model(model_name: str):
    path = _MODELS_DIR / model_name

    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")

    if model_name not in _loaded_models:
        _loaded_models[model_name] = joblib.load(path)

    return _loaded_models[model_name]
