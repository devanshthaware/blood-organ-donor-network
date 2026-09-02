/**
 * LLM Service for generating explanations from ML outputs
 * 
 * Supports multiple LLM providers:
 * - OpenAI (GPT models)
 * - Anthropic (Claude)
 * - Hugging Face (for local models like Gemma)
 * - Ollama (for local models like Llama, Mistral, Gemma)
 * - Fallback to rule-based explanation if LLM unavailable
 */

import * as logger from "firebase-functions/logger";
import axios, {AxiosRequestConfig} from "axios";
import type {UIScreen} from "./llm-prompt";

/**
 * UI-Specific Explanation Formats
 */

// Hospital Dashboard – Donor Matching Card
export interface HospitalDashboardExplanation {
  title: string;
  summary: string;
  reasons: string[];
  urgency_label: "Low" | "Medium" | "High" | "Critical";
  action_hint: string;
}

// Donor Request Screen – Accept / Decline View
export interface DonorRequestExplanation {
  headline: string;
  explanation: string;
  impact_note: string;
}

// Hospital Request Creation Screen
export interface HospitalRequestCreationExplanation {
  insight: string;
  note: string;
}

// Reservations / Match Confirmation Screen
export interface ReservationConfirmationExplanation {
  confidence_level: "Low" | "Medium" | "High";
  explanation: string;
}

// Emergency Alert Screen
export interface EmergencyAlertExplanation {
  alert_title: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  reason: string;
  system_action: string;
}

// Admin Monitor – AI Decision Explanation
export interface AdminMonitorExplanation {
  decision_summary: string;
  key_factors: string[];
  ethical_status: "Passed" | "Review" | "Failed";
}

// Union type for all possible explanations
export type LLMExplanation = 
  | HospitalDashboardExplanation
  | DonorRequestExplanation
  | HospitalRequestCreationExplanation
  | ReservationConfirmationExplanation
  | EmergencyAlertExplanation
  | AdminMonitorExplanation;

/**
 * Generate explanation using LLM
 * Falls back to rule-based explanation if LLM fails or is unavailable
 */
export async function generateLLMExplanation(
  llmInput: Record<string, unknown>,
  promptTemplate: string,
  fallbackExplanation: string
): Promise<LLMExplanation | null> {
  const llmProvider = process.env.LLM_PROVIDER || "none";
  const llmApiUrl = process.env.LLM_API_URL;
  const llmApiKey = process.env.LLM_API_KEY;

  // If LLM is disabled or not configured, return null to use fallback
  if (llmProvider === "none" || !llmApiUrl) {
    logger.debug("LLM service not configured, using fallback explanation");
    return null;
  }

  try {
    let explanation: LLMExplanation | null = null;

    switch (llmProvider.toLowerCase()) {
      case "openai":
        explanation = await callOpenAI(llmApiUrl, llmApiKey, promptTemplate, llmInput);
        break;
      case "anthropic":
        explanation = await callAnthropic(llmApiUrl, llmApiKey, promptTemplate, llmInput);
        break;
      case "huggingface":
      case "gemma":
        explanation = await callHuggingFace(llmApiUrl, llmApiKey, promptTemplate, llmInput);
        break;
      case "ollama":
        explanation = await callOllama(llmApiUrl, llmApiKey, promptTemplate, llmInput);
        break;
      default:
        logger.warn(`Unknown LLM provider: ${llmProvider}, using fallback`);
        return null;
    }

    if (explanation) {
      logger.info("LLM explanation generated successfully", {
        donor_category: explanation.donor_category,
        action_priority: explanation.action_priority,
        confidence_level: explanation.confidence_level,
      });
      return explanation;
    }
  } catch (error) {
    logger.error("Error generating LLM explanation", error);
    // Don't throw - fall back to rule-based explanation
  }

  return null;
}

/**
 * Call OpenAI API (GPT models)
 */
async function callOpenAI(
  apiUrl: string,
  apiKey: string | undefined,
  promptTemplate: string,
  llmInput: Record<string, unknown>
): Promise<LLMExplanation | null> {
  const messages = [
    {
      role: "system" as const,
      content: promptTemplate,
    },
    {
      role: "user" as const,
      content: JSON.stringify(llmInput),
    },
  ];

  const config: AxiosRequestConfig = {
    method: "POST",
    url: apiUrl || "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    data: {
      model: process.env.LLM_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.3, // Low temperature for deterministic output
      max_tokens: 500,
      response_format: {type: "json_object"}, // Force JSON output
    },
    timeout: 10000,
  };

  const response = await axios.request(config);
  const content = response.data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  return parseLLMResponse(content);
}

/**
 * Call Anthropic API (Claude)
 */
async function callAnthropic(
  apiUrl: string,
  apiKey: string | undefined,
  promptTemplate: string,
  llmInput: Record<string, unknown>
): Promise<LLMExplanation | null> {
  const prompt = `${promptTemplate}\n\nInput JSON:\n${JSON.stringify(llmInput, null, 2)}\n\nOutput:`;

  const config: AxiosRequestConfig = {
    method: "POST",
    url: apiUrl || "https://api.anthropic.com/v1/messages",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey || "",
      "anthropic-version": "2023-06-01",
    },
    data: {
      model: process.env.LLM_MODEL || "claude-3-haiku-20240307",
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    },
    timeout: 10000,
  };

  const response = await axios.request(config);
  const content = response.data.content[0]?.text;
  
  if (!content) {
    throw new Error("No content in Anthropic response");
  }

  return parseLLMResponse(content);
}

/**
 * Call Hugging Face API (for models like Gemma 7B)
 */
async function callHuggingFace(
  apiUrl: string,
  apiKey: string | undefined,
  promptTemplate: string,
  llmInput: Record<string, unknown>
): Promise<LLMExplanation | null> {
  const prompt = `${promptTemplate}\n\nInput JSON:\n${JSON.stringify(llmInput, null, 2)}\n\nOutput:`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const config: AxiosRequestConfig = {
    method: "POST",
    url: apiUrl,
    headers,
    data: {
      inputs: prompt,
      parameters: {
        temperature: 0.3,
        max_new_tokens: 500,
        return_full_text: false,
      },
      options: {
        wait_for_model: true,
      },
    },
    timeout: 30000, // Hugging Face can be slower
  };

  const response = await axios.request(config);
  
  // Hugging Face returns array of generated text
  const content = Array.isArray(response.data) 
    ? response.data[0]?.generated_text 
    : response.data?.generated_text || response.data?.[0]?.generated_text;
  
  if (!content) {
    throw new Error("No content in Hugging Face response");
  }

  return parseLLMResponse(content);
}

/**
 * Call Ollama API (for local models like Llama, Mistral, Gemma)
 * 
 * Ollama typically runs locally at http://localhost:11434
 * API key is optional for local usage, but can be set for authenticated servers
 */
async function callOllama(
  apiUrl: string,
  apiKey: string | undefined,
  promptTemplate: string,
  llmInput: Record<string, unknown>
): Promise<LLMExplanation | null> {
  const prompt = `${promptTemplate}\n\nInput JSON:\n${JSON.stringify(llmInput, null, 2)}\n\nOutput:`;

  // Get model name from environment or default to gemma:7b-instruct-q4_K_M
  const modelName = process.env.LLM_MODEL || "gemma:7b-instruct-q4_K_M";

  // Ollama uses /api/chat endpoint for chat models, or /api/generate for completion models
  // Default to /api/chat as it's more commonly used
  const ollamaUrl = apiUrl || "http://localhost:11434/api/chat";
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Ollama API key is optional (typically not needed for local usage)
  // But can be used for authenticated remote Ollama servers
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const config: AxiosRequestConfig = {
    method: "POST",
    url: ollamaUrl,
    headers,
    data: {
      model: modelName,
      messages: [
        {
          role: "system",
          content: promptTemplate,
        },
        {
          role: "user",
          content: JSON.stringify(llmInput),
        },
      ],
      stream: false, // Get complete response
      options: {
        temperature: 0.3,
        num_predict: 500, // Max tokens
      },
    },
    timeout: 60000, // Ollama can be slow depending on model size
  };

  try {
    const response = await axios.request(config);
    
    // Ollama /api/chat returns response in message.content
    const content = response.data?.message?.content || response.data?.response;
    
    if (!content) {
      throw new Error("No content in Ollama response");
    }

    return parseLLMResponse(content);
  } catch (error) {
    // If /api/chat fails, try /api/generate as fallback
    if (ollamaUrl.includes("/api/chat")) {
      logger.debug("Ollama /api/chat failed, trying /api/generate");
      const generateUrl = ollamaUrl.replace("/api/chat", "/api/generate");
      
      const generateConfig: AxiosRequestConfig = {
        ...config,
        url: generateUrl,
        data: {
          model: modelName,
          prompt: `${promptTemplate}\n\nInput JSON:\n${JSON.stringify(llmInput, null, 2)}\n\nOutput:`,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 500,
          },
        },
      };
      
      const generateResponse = await axios.request(generateConfig);
      const generateContent = generateResponse.data?.response;
      
      if (!generateContent) {
        throw new Error("No content in Ollama /api/generate response");
      }
      
      return parseLLMResponse(generateContent);
    }
    
    throw error;
  }
}

/**
 * Parse LLM response and extract JSON
 * Handles responses wrapped in markdown code blocks or plain JSON
 */
function parseLLMResponse(content: string): LLMExplanation {
  // Remove markdown code blocks if present
  let jsonStr = content.trim();
  
  // Remove ```json and ``` if present
  jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  
  // Try to extract JSON object if wrapped in text
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    
    // Validate based on which format is present
    // Check for Hospital Dashboard format
    if (parsed.title && parsed.summary && parsed.reasons && parsed.urgency_label && parsed.action_hint) {
      return parsed as HospitalDashboardExplanation;
    }
    
    // Check for Donor Request format
    if (parsed.headline && parsed.explanation && parsed.impact_note) {
      return parsed as DonorRequestExplanation;
    }
    
    // Check for Hospital Request Creation format
    if (parsed.insight && parsed.note) {
      return parsed as HospitalRequestCreationExplanation;
    }
    
    // Check for Reservation Confirmation format
    if (parsed.confidence_level && parsed.explanation) {
      return parsed as ReservationConfirmationExplanation;
    }
    
    // Check for Emergency Alert format
    if (parsed.alert_title && parsed.severity && parsed.reason && parsed.system_action) {
      return parsed as EmergencyAlertExplanation;
    }
    
    // Check for Admin Monitor format
    if (parsed.decision_summary && parsed.key_factors && parsed.ethical_status) {
      return parsed as AdminMonitorExplanation;
    }
    
    // If no recognized format, throw error
    throw new Error("LLM response does not match any expected UI format");
  } catch (error) {
    logger.error("Failed to parse LLM response as JSON", {
      content: jsonStr.substring(0, 500),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Generate fallback rule-based explanation
 * Used when LLM is unavailable or fails
 */
export function generateFallbackExplanation(
  availabilityScore: number,
  reliabilityScore: number,
  combinedScore: number,
  distanceKm: number,
  urgency: string,
  screen: "hospital_dashboard" | "donor_request" | "reservation_confirmation" = "hospital_dashboard"
): LLMExplanation {
  // Determine category based on scores
  let donor_category: "Highly Suitable" | "Moderately Suitable" | "Low Suitability" | "Not Recommended";
  let action_priority: "immediate" | "scheduled" | "deferred";
  let urgency_badge: "Low" | "Medium" | "High" | "Critical";
  let headline: string;
  let explanation: string;
  let next_action: string;
  let confidence_note: string | undefined;

  // Map urgency to label
  const urgencyUpper = urgency.toUpperCase();
  const urgencyLabel: "Low" | "Medium" | "High" | "Critical" = 
    urgencyUpper === "CRITICAL" ? "Critical" :
    urgencyUpper === "HIGH" ? "High" :
    urgencyUpper === "MEDIUM" ? "Medium" : "Low";

  // Generate explanation based on screen type
  if (screen === "hospital_dashboard") {
    // Hospital Dashboard format
    const reasons: string[] = [];
    
    if (combinedScore >= 0.7 && availabilityScore >= 0.6 && reliabilityScore >= 0.6) {
      reasons.push("Compatible blood group");
      if (distanceKm < 20) {
        reasons.push("Donor is nearby");
      } else {
        reasons.push(`Donor is ${distanceKm.toFixed(0)} km away`);
      }
      reasons.push("Reliable past donation history");
      
      return {
        title: "Strong donor match identified",
        summary: "This donor closely matches the request requirements.",
        reasons,
        urgency_label: urgencyLabel,
        action_hint: urgency === "CRITICAL" || urgency === "HIGH" 
          ? "Immediate notification recommended" 
          : "Schedule notification soon",
      } as HospitalDashboardExplanation;
    } else if (combinedScore >= 0.5) {
      reasons.push("Compatible blood group");
      reasons.push(`Located ${distanceKm.toFixed(0)} km away`);
      reasons.push("Moderate reliability history");
      
      return {
        title: "Suitable donor match",
        summary: "This donor meets the basic requirements for this request.",
        reasons,
        urgency_label: urgencyLabel,
        action_hint: "Consider as primary or backup option",
      } as HospitalDashboardExplanation;
    } else {
      reasons.push("Compatible blood group");
      reasons.push("Lower reliability indicators");
      
      return {
        title: "Limited match quality",
        summary: "This donor may be available but has lower confidence indicators.",
        reasons,
        urgency_label: urgencyLabel,
        action_hint: "Keep as backup option",
      } as HospitalDashboardExplanation;
    }
  } else if (screen === "donor_request") {
    // Donor Request format
    if (combinedScore >= 0.7) {
      return {
        headline: "You were selected for a blood request",
        explanation: distanceKm < 20 
          ? "You are eligible and located close to the hospital, making your support valuable."
          : `You are eligible and located ${distanceKm.toFixed(0)} km from the hospital.`,
        impact_note: urgency === "CRITICAL" || urgency === "HIGH"
          ? "Your donation can help a patient in urgent need"
          : "Your donation can help meet an important need",
      } as DonorRequestExplanation;
    } else {
      return {
        headline: "Blood request available",
        explanation: "You may be eligible for this donation request based on your profile.",
        impact_note: "Your support would be valuable if you're available",
      } as DonorRequestExplanation;
    }
  } else {
    // Reservation Confirmation format (default)
    const confidenceLevel: "Low" | "Medium" | "High" = 
      combinedScore >= 0.7 ? "High" :
      combinedScore >= 0.5 ? "Medium" : "Low";
    
    return {
      confidence_level: confidenceLevel,
      explanation: combinedScore >= 0.7
        ? "The donor meets eligibility, availability, and proximity requirements."
        : "The donor meets basic eligibility requirements.",
    } as ReservationConfirmationExplanation;
  }
}
