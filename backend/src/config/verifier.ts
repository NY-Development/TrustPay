import { VerifierClient } from '@creofam/verifier';
import { env } from './env';

if (!env.VERIFIER_API_KEY) {
  throw new Error('CRITICAL: VERIFIER_API_KEY is not defined in environment variables.');
}

export const verifierClient = new VerifierClient({
  apiKey: env.VERIFIER_API_KEY,
  timeoutMs: 15000,
  max429Retries: 3,
  retryDelayMs: 1000,
});
