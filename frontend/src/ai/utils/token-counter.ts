/**
 * Token Counter — Approximate Token Estimation
 *
 * Estimates token count for prompt truncation without
 * requiring a full tokenizer. Uses character-based heuristic.
 */

/** Average characters per token for English text */
const CHARS_PER_TOKEN = 4;

/**
 * Estimate the number of tokens in a string.
 * Uses the ~4 chars/token heuristic for GPT-family models.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Truncate text to fit within a token budget.
 */
export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n... [truncated]';
}

/**
 * Check if a prompt is within the model's context window.
 */
export function fitsContextWindow(prompt: string, contextWindow: number): boolean {
  return estimateTokens(prompt) <= contextWindow;
}
