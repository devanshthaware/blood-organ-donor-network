# Ollama Setup Guide for VeinLink LLM Explanations

Ollama allows you to run LLM models locally, which is perfect for:
- **Privacy**: No data sent to external APIs
- **Cost**: Free to run (no API costs)
- **Offline**: Works without internet connection
- **Control**: Full control over models and data

## Quick Setup

### 1. Install Ollama

**Windows:**
```bash
# Download from https://ollama.com/download
# Or use winget
winget install Ollama.Ollama
```

**macOS:**
```bash
brew install ollama
# Or download from https://ollama.com/download
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Start Ollama Service

```bash
ollama serve
```

This starts Ollama on `http://localhost:11434` (default port).

### 3. Pull the Model

Pull the Gemma 7B Instruct quantized model:

```bash
# Recommended: Gemma 7B Instruct (quantized - smaller, faster)
ollama pull gemma:7b-instruct-q4_K_M

# Alternative models:
# ollama pull llama3.2  # Smaller, faster
# ollama pull mistral   # More capable
# ollama pull gemma:7b  # Full precision (slower, larger)
```

### 4. Configure VeinLink Functions

Create or update `functions/.env`:

```env
# Ollama Configuration
LLM_PROVIDER=ollama
LLM_API_URL=http://localhost:11434/api/chat
LLM_MODEL=gemma:7b-instruct-q4_K_M
# LLM_API_KEY is optional - leave empty for local usage
LLM_API_KEY=
```

**For remote Ollama server** (if Ollama is on another machine):
```env
LLM_PROVIDER=ollama
LLM_API_URL=http://your-server-ip:11434/api/chat
LLM_MODEL=llama3.2
LLM_API_KEY=your-api-key  # If Ollama is configured with authentication
```

### 5. Test Configuration

```bash
cd functions
npm run serve
# Or in production
firebase functions:log
```

Check logs for:
- `LLM explanation generated successfully` - ✅ Working!
- `LLM explanation generation failed` - ❌ Check Ollama is running

## Environment Variables Reference

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `ollama` | Must be set to `ollama` |
| `LLM_API_URL` | `http://localhost:11434/api/chat` | Ollama API endpoint |
| `LLM_MODEL` | `gemma:7b-instruct-q4_K_M` | Model name (must be pulled with `ollama pull`) |

### Optional

| Variable | Example | Description |
|----------|---------|-------------|
| `LLM_API_KEY` | (empty) | Usually not needed for local Ollama |

## Available Models

### Recommended Models

1. **gemma:7b-instruct-q4_K_M** (Recommended ⭐)
   - ✅ Google's Gemma 7B Instruct model
   - ✅ Quantized (Q4) - smaller, faster
   - ✅ Optimized for instruction following
   - ✅ Good for structured JSON output
   - ✅ Moderate memory (~4GB RAM)
   - Command: `ollama pull gemma:7b-instruct-q4_K_M`

2. **llama3.2** (3B parameters)
   - ✅ Fast and efficient
   - ✅ Good for structured JSON output
   - ✅ Low memory usage (~2GB RAM)
   - Command: `ollama pull llama3.2`

3. **mistral** (7B parameters)
   - ✅ Better reasoning
   - ✅ Higher quality output
   - ⚠️ More memory (~4GB RAM)
   - Command: `ollama pull mistral`

4. **gemma:7b** (Full precision)
   - ✅ Google's model (full precision)
   - ✅ Highest quality
   - ⚠️ More memory (~8GB RAM)
   - Command: `ollama pull gemma:7b`

### List Available Models

```bash
ollama list
```

### Pull a Model

```bash
ollama pull <model-name>
```

## Testing Ollama Connection

### Test API Directly

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "gemma:7b-instruct-q4_K_M",
  "messages": [
    {"role": "user", "content": "Say hello"}
  ],
  "stream": false
}'
```

### Test from VeinLink

1. Start Firebase Functions emulator
2. Create a donation request
3. Check logs for LLM explanation generation

## Troubleshooting

### Ollama Not Running

**Error:** Connection refused or timeout

**Solution:**
```bash
# Check if Ollama is running
ollama serve

# Or check if it's running as a service
# Windows: Check Services app
# Linux/Mac: systemctl status ollama
```

### Model Not Found

**Error:** Model not found or 404

**Solution:**
```bash
# Pull the model first
ollama pull llama3.2

# Verify it's available
ollama list
```

### Slow Responses

**Issue:** LLM explanations take too long

**Solutions:**
1. Use a smaller model (llama3.2 instead of mistral)
2. Ensure Ollama has enough RAM
3. Use GPU acceleration if available:
   ```bash
   # Check GPU support
   ollama show llama3.2
   ```

### Wrong API Endpoint

**Error:** 404 or method not allowed

**Solution:**
- Use `/api/chat` for chat models: `http://localhost:11434/api/chat`
- Or `/api/generate` for completion: `http://localhost:11434/api/generate`
- The system automatically tries both

## Remote Ollama Setup (Optional)

If you want to run Ollama on a separate server:

### 1. Configure Ollama Server

Edit `~/.ollama/config.json`:
```json
{
  "host": "0.0.0.0:11434"
}
```

### 2. Set Up Authentication (Recommended)

```bash
# Set OLLAMA_API_KEY environment variable on server
export OLLAMA_API_KEY=your-secret-key
```

### 3. Update Functions Config

```env
LLM_PROVIDER=ollama
LLM_API_URL=http://your-server-ip:11434/api/chat
LLM_MODEL=gemma:7b-instruct-q4_K_M
LLM_API_KEY=your-secret-key
```

### 4. Firewall Rules

Ensure port 11434 is open on the server:
```bash
# Linux
sudo ufw allow 11434
```

## Performance Tips

1. **Use smaller models** for faster responses
2. **Enable GPU** if available (much faster)
3. **Keep Ollama running** as a service (don't restart)
4. **Warm up models** by calling once before production use

## Cost Comparison

| Provider | Cost per Request | Notes |
|----------|------------------|-------|
| Ollama (Local) | Free | Runs on your hardware |
| OpenAI GPT-4o-mini | ~$0.0001 | Very cheap |
| Anthropic Claude Haiku | ~$0.0002 | Cheap |
| Hugging Face | Free (limited) | Free tier available |

For a high-volume system, Ollama can save significant costs!
