# LLM Decision & Explanation System

## Overview

The LLM Explanation System provides human-readable, explainable AI decisions by interpreting ML model outputs. It does NOT generate predictions or provide medical advice - it only interprets structured outputs from ML models.

## Architecture

```
ML Models (Availability, Reliability, Demand)
    ↓
Cloud Functions (onDemandForecastCreated)
    ↓
LLM Service (generates explanation)
    ↓
Reservation Document (stores explanation)
    ↓
UI (displays to users)
```

## Key Principles

1. **LLM does NOT predict** - avoids hallucination
2. **ML remains source of truth** - LLM only interprets
3. **JSON-only output** - safe for frontend & backend
4. **Explainable AI** - human-readable reasoning
5. **Graceful fallback** - works even if LLM is unavailable

## Configuration

### Environment Variables

Add to `functions/.env`:

```bash
# Enable LLM provider (options: openai, anthropic, huggingface, gemma, none)
LLM_PROVIDER=openai

# API Configuration
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=your-api-key-here
```

### Supported Providers

1. **OpenAI** (GPT models)
   - `LLM_PROVIDER=openai`
   - `LLM_MODEL=gpt-4o-mini` (recommended) or `gpt-4`
   - `LLM_API_KEY=your-openai-api-key`
   
2. **Anthropic** (Claude)
   - `LLM_PROVIDER=anthropic`
   - `LLM_MODEL=claude-3-haiku-20240307` (fast & cheap)
   - `LLM_API_KEY=your-anthropic-api-key`
   
3. **Hugging Face** (Cloud models like Gemma 7B)
   - `LLM_PROVIDER=huggingface`
   - `LLM_API_URL=https://api-inference.huggingface.co/models/google/gemma-7b-it`
   - `LLM_API_KEY=your-huggingface-token` (optional)
   
4. **Ollama** (Local models like Llama, Mistral, Gemma)
   - `LLM_PROVIDER=ollama`
   - `LLM_API_URL=http://localhost:11434/api/chat` (default)
   - `LLM_MODEL=gemma:7b-instruct-q4_K_M` (recommended) or `llama3.2`, `mistral`, etc.
   - `LLM_API_KEY=` (optional - typically not needed for local usage)
   
5. **Disabled** (Rule-based fallback only)
   - `LLM_PROVIDER=none` or leave unset

## How It Works

### 1. ML Models Generate Predictions

The system collects three ML outputs:
- **Availability probability** (0.0 - 1.0)
- **Reliability score** (0.0 - 1.0)
- **Demand forecast** (0.0 - 1.0)

### 2. LLM Service Interprets Outputs

The LLM receives structured JSON:
```json
{
  "availability_model": {
    "availability_probability": 0.85
  },
  "reliability_model": {
    "reliability_score": 0.78
  },
  "demand_model": {
    "predicted_demand": 0.72
  },
  "request_context": {
    "blood_group": "B+",
    "urgency_level": "high",
    "distance_km": 12.5,
    "time_of_day": 14,
    "quantity": 2
  }
}
```

### 3. LLM Generates Explanation

The LLM returns structured JSON:
```json
{
  "donor_category": "Highly Suitable",
  "action_priority": "immediate",
  "summary_reasoning": "Availability probability is 85% and reliability score is 78%. Distance to hospital is 12.5 km. Overall match score: 82%.",
  "confidence_level": "high",
  "developer_notes": "High availability and reliability scores with moderate distance. Urgency level increases priority."
}
```

### 4. Reservation Document Stores Explanation

```json
{
  "requestId": "req789",
  "donorId": "donor456",
  "mlScores": {
    "availability": 0.85,
    "reliability": 0.78,
    "combined": 0.822
  },
  "explanation": "Availability probability is 85% and reliability score is 78%...",
  "llmExplanation": {
    "donor_category": "Highly Suitable",
    "action_priority": "immediate",
    "confidence_level": "high",
    "developer_notes": "High availability and reliability scores..."
  }
}
```

## Fallback Mechanism

If LLM is unavailable or fails:
- System uses rule-based explanation generator
- No impact on matching functionality
- Reservations still created with ML scores
- Explanation is still human-readable

## Decision Guidelines

The LLM follows these rules:

| Scores | Category | Priority |
|--------|----------|----------|
| High availability (≥0.7) + High reliability (≥0.7) + High demand (≥0.5) | Highly Suitable | Immediate |
| Medium scores (0.4-0.7) | Moderately Suitable | Scheduled |
| Low availability (<0.4) or reliability (<0.4) | Low Suitability | Deferred |
| Very low scores (<0.3) | Not Recommended | Deferred |

**Additional factors:**
- Distance <20km → increases confidence
- Distance >50km → reduces suitability
- Urgency (critical/high) → increases priority but doesn't override very low scores

## Usage in Code

### Generating Explanation

```typescript
import { generateLLMExplanation, generateFallbackExplanation } from "./llm-service";
import { prepareLLMInput, LLM_MASTER_PROMPT } from "./llm-prompt";

// Prepare input from ML outputs
const llmInput = prepareLLMInput(
  availabilityOutput,
  reliabilityOutput,
  demandOutput,
  {
    bloodGroup: "B+",
    urgency: "HIGH",
    distanceKm: 12.5,
    quantity: 2,
  }
);

// Generate LLM explanation (with fallback)
let llmExplanation = await generateLLMExplanation(
  llmInput,
  LLM_MASTER_PROMPT,
  "" // Fallback will be generated if LLM fails
);

if (!llmExplanation) {
  // Use rule-based fallback
  llmExplanation = generateFallbackExplanation(
    availabilityScore,
    reliabilityScore,
    combinedScore,
    distanceKm,
    urgency
  );
}

// Use explanation.summary_reasoning for display
```

## Testing

### Test with LLM Disabled

```bash
# In functions/.env
LLM_PROVIDER=none
```

System will use rule-based explanations.

### Test with OpenAI

```bash
# In functions/.env
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
```

### Test Locally

```bash
cd functions
npm run serve
```

Check Cloud Functions logs to see LLM explanation generation.

## Cost Considerations

- **OpenAI GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Anthropic Claude Haiku**: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens
- **Hugging Face**: Varies by model, some free tiers available
- **Ollama**: Free (runs locally, no API costs)
- **Rule-based fallback**: Free (no API calls)

For a blood donation platform processing 1000 requests/day:
- ~$0.01-0.05 per request with LLM
- Consider caching explanations for similar scenarios

## Security

- API keys stored in environment variables (never committed)
- LLM outputs validated before use
- Fallback ensures system always works
- No PII sent to LLM (only scores and metadata)

## Monitoring

Check Cloud Functions logs for:
- `LLM explanation generated successfully` - Success
- `LLM explanation generation failed` - Fallback used
- `LLM service not configured` - Using rule-based fallback

## Future Enhancements

- Cache explanations for similar scenarios
- Fine-tune prompt based on feedback
- A/B test different LLM providers
- Add explanation quality metrics
