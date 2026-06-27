import { env } from './env';

/**
 * Verify.ET API configuration
 * Replaces the old @creofam/verifier SDK
 */
export const verifyEtConfig = {
  baseUrl: env.VERIFY_ET_BASE_URL,
  apiKey: env.VERIFY_ET_API_KEY,
  /** Default wait time in ms for the short-wait flow */
  defaultWaitMs: 5000,
  /** Max polling attempts for queued verifications */
  maxPollAttempts: 20,
  /** Default poll interval in ms (overridden by API's pollAfterMs) */
  defaultPollIntervalMs: 1500,
};
