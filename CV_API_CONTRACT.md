# VeinLink — Computer Vision & OCR API Contract

**Service**: FastAPI ML & Computer Vision Service  
**Base URL**: `http://localhost:8000` (or `process.env.ML_BACKEND_URL`)  
**API Version**: `1.0.0`  

---

## 1. POST `/ocr/extract`

Accepts an image payload and extracts structured physical-item metadata.

### Request Body (`OCRExtractRequest`)
```json
{
  "image_base64": "data:image/jpeg;base64,...",
  "entity_type": "ORGAN",
  "verification_type": "ORGAN_IDENTIFIER_VERIFICATION"
}
```

### Response Body (`OCRExtractResponse`)
```json
{
  "raw_text": "VEINLINK ORGAN SPECIMEN LABEL Identifier: ORG-1042 Blood Group: O-",
  "fields": {
    "identifier": "ORG-1042",
    "organ_type": "KIDNEY",
    "blood_group": "O-",
    "barcode": "BAR-ORG-1042"
  },
  "confidence": 0.94,
  "bounding_boxes": [
    { "field": "identifier", "x": 0.1, "y": 0.15, "width": 0.4, "height": 0.08, "confidence": 0.96 },
    { "field": "blood_group", "x": 0.55, "y": 0.15, "width": 0.25, "height": 0.08, "confidence": 0.94 }
  ],
  "image_quality": {
    "is_usable": true,
    "blur_score": 0.08,
    "resolution": "1920x1080",
    "warnings": []
  },
  "engine": "VeinLink-Vision-OCR-Engine",
  "engine_version": "1.0.0"
}
```

---

## 2. POST `/vision/verify-label`

Evaluates extracted fields against expected authoritative database record fields.

### Request Body (`LabelVerificationRequest`)
```json
{
  "extracted_fields": {
    "identifier": "ORG-1042",
    "blood_group": "AB+"
  },
  "expected_fields": {
    "identifier": "ORG-1042",
    "blood_group": "O-"
  },
  "entity_type": "ORGAN"
}
```

### Response Body (`LabelVerificationResponse`)
```json
{
  "status": "MISMATCH",
  "confidence": 0.95,
  "mismatches": [
    {
      "field": "blood_group",
      "expected": "O-",
      "observed": "AB+",
      "severity": "CRITICAL"
    }
  ],
  "explanation": "Detected 1 critical field discrepancies between physical label and digital record."
}
```

---

## 3. Resilient Error Handling & Fallback Behavior

- **Timeout**: Convex actions enforce a 3500ms timeout on FastAPI requests.
- **Offline / Unavailable**: If the service is unreachable or encounters an internal exception (HTTP 500), Convex engages a deterministic local parser fallback, returning a structured response with `engine: "VeinLink-Fallback-Parser"`, allowing seamless manual verification without downtime.
