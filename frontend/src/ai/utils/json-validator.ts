/**
 * JSON Validator — Zod Validation Utility
 *
 * Validates raw JSON strings against Zod schemas with fallback.
 */
import type { z } from 'zod';
import { safeParseJson } from '../parsers/json-repair';

/**
 * Parse and validate a raw JSON string against a Zod schema.
 * Returns the validated object or the fallback on any failure.
 */
export function validateOrFallback<T>(
  schema: z.ZodType<T>,
  raw: string,
  fallback: T,
): T {
  try {
    const parsed = safeParseJson<unknown>(raw);
    if (parsed === null) return fallback;

    const result = schema.safeParse(parsed);
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Validate an already-parsed object against a Zod schema.
 */
export function validateObject<T>(
  schema: z.ZodType<T>,
  obj: unknown,
  fallback: T,
): T {
  const result = schema.safeParse(obj);
  return result.success ? result.data : fallback;
}
