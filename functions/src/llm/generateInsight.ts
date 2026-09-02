import { fallbackInsight } from "./fallback";
import { AIInsight, LLMInput } from "../../../contracts/llm_contract";
import axios, { AxiosRequestConfig } from "axios";
import * as logger from "firebase-functions/logger";

const TIMEOUT_MS = 60000; // 60s timeout for local LLM

export async function generateInsight(input: LLMInput): Promise<AIInsight> {
    const llmApiUrl = process.env.LLM_API_URL || "http://localhost:11434/api/generate";
    const modelName = process.env.LLM_MODEL || "gemma:7b-instruct-q4_K_M";

    logger.info("Calling LLM...", { url: llmApiUrl, model: modelName });

    try {
        const config: AxiosRequestConfig = {
            method: "POST",
            url: llmApiUrl,
            headers: { "Content-Type": "application/json" },
            data: {
                model: modelName,
                prompt: buildPrompt(input),
                stream: false,
                options: {
                    temperature: 0.1, // Deterministic
                    num_ctx: 1024
                },
                format: "json" // Force JSON mode if supported by Ollama/Model
            },
            timeout: TIMEOUT_MS
        };

        const response = await axios.request(config);

        // Parse response - Ollama returns result in 'response' field
        const resultText = response.data?.response;

        if (!resultText) {
            throw new Error("Empty response from LLM");
        }

        // Try to find JSON in response if it includes text
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : resultText;

        const parsed = JSON.parse(jsonStr);

        return {
            source: "llm",
            title: parsed.title || "AI Analysis",
            summary: parsed.summary || "Analysis completed.",
            bullets: Array.isArray(parsed.reasons) ? parsed.reasons : (Array.isArray(parsed.bullets) ? parsed.bullets : []),
            confidence: parsed.confidence_level || parsed.confidence || "MEDIUM"
        };

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.warn(`LLM unavailable or failed, using fallback: ${errorMessage}`);
        return fallbackInsight(input.data);
    }
}

function buildPrompt(input: LLMInput) {
    return `
You are an AI explanation engine for VeinLink.

Role: ${input.role}
Screen: ${input.screen}
Event: ${input.event}

Context data:
${JSON.stringify(input.data, null, 2)}

Instructions:
1. Analyze the context data.
2. Return ONLY valid JSON.
3. Use the following schema:
{
  "title": "Short title",
  "summary": "1-2 sentence summary",
  "reasons": ["Specific reason 1", "Specific reason 2", "Specific reason 3"],
  "confidence_level": "High" | "Medium" | "Low"
}

Do not include markdown formatting.
`;
}
