/**
 * Prompt Builder — Dynamic Prompt Construction
 *
 * Centralizes all prompt generation so no string concatenation
 * happens in pages or providers.
 */
import {
  RECEIPT_EXTRACTION_PROMPT,
  INSIGHT_GENERATION_PROMPT,
  AUDIT_GENERATION_PROMPT,
  CATEGORIZATION_PROMPT,
  SUMMARIZATION_PROMPT,
  ANOMALY_DETECTION_PROMPT,
} from '../prompt-templates';
import type { ModelTask } from '../types/model.types';
import { estimateTokens } from './token-counter';

const MAX_DATA_TOKENS = 6000;

const PROMPT_MAP: Record<string, string> = {
  'receipt-extraction': RECEIPT_EXTRACTION_PROMPT,
  'insight-generation': INSIGHT_GENERATION_PROMPT,
  'audit-generation': AUDIT_GENERATION_PROMPT,
  'categorization': CATEGORIZATION_PROMPT,
  'summarization': SUMMARIZATION_PROMPT,
  'anomaly-detection': ANOMALY_DETECTION_PROMPT,
};

/**
 * Build a complete prompt for a given task and data payload.
 * Automatically truncates data if it exceeds token budget.
 */
export function buildPrompt(task: ModelTask | string, data: string): string {
  const template = PROMPT_MAP[task];
  if (!template) {
    return data; // Fallback: use raw data as prompt
  }

  // Truncate data if too large
  const tokens = estimateTokens(data);
  let truncatedData = data;
  if (tokens > MAX_DATA_TOKENS) {
    // Rough char-based truncation (4 chars ≈ 1 token)
    const maxChars = MAX_DATA_TOKENS * 4;
    truncatedData = data.slice(0, maxChars) + '\n... [truncated]';
  }

  return template + truncatedData;
}

/**
 * Build a prompt with system/user role formatting (for chat-style models).
 */
export function buildChatPrompt(
  task: ModelTask | string,
  data: string,
  systemPrompt?: string,
): Array<{ role: 'system' | 'user'; content: string }> {
  const prompt = buildPrompt(task, data);
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });
  return messages;
}
