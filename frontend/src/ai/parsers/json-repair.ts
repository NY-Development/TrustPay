/**
 * JSON Repair — Fix Malformed LLM Output
 *
 * LLMs sometimes return invalid JSON (trailing commas,
 * unquoted keys, truncated output, markdown wrappers).
 * This utility attempts to repair common issues.
 */

export function repairJson(raw: string): string {
  let text = raw.trim();

  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // Extract JSON from surrounding prose
  const objStart = text.indexOf('{');
  const objEnd = text.lastIndexOf('}');
  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');

  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    // Check if array wraps the object
    if (arrStart !== -1 && arrStart < objStart && arrEnd > objEnd) {
      text = text.slice(arrStart, arrEnd + 1);
    } else {
      text = text.slice(objStart, objEnd + 1);
    }
  } else if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    text = text.slice(arrStart, arrEnd + 1);
  }

  // Fix trailing commas before closing brackets
  text = text.replace(/,\s*([\]}])/g, '$1');

  // Fix unquoted keys: { key: value } → { "key": value }
  text = text.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Fix single-quoted strings to double-quoted
  text = text.replace(/'([^']*)'/g, '"$1"');

  // Fix truncated JSON — try adding missing closing brackets
  const openBraces = (text.match(/{/g) || []).length;
  const closeBraces = (text.match(/}/g) || []).length;
  const openBrackets = (text.match(/\[/g) || []).length;
  const closeBrackets = (text.match(/]/g) || []).length;

  for (let i = 0; i < openBrackets - closeBrackets; i++) text += ']';
  for (let i = 0; i < openBraces - closeBraces; i++) text += '}';

  return text;
}

/**
 * Try to parse JSON, repairing if needed.
 * Returns null if repair fails.
 */
export function safeParseJson<T>(raw: string): T | null {
  // First try direct parse
  try {
    return JSON.parse(raw);
  } catch { /* continue to repair */ }

  // Try repaired
  try {
    const repaired = repairJson(raw);
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}
