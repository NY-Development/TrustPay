import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  // MongoDB
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  // Cookie
  // No default: an explicit domain only makes sense when the frontend and API
  // share a parent domain (e.g. both under `.trustpay.com`). Leaving this unset
  // scopes the cookie to the exact request host, which is what a cross-site
  // *.vercel.app deployment needs — a mismatched Domain attribute makes the
  // browser silently drop the Set-Cookie header entirely.
  COOKIE_DOMAIN: z.string().optional(),
  // Deliberately no default — undefined (not set at all) is distinct from an
  // explicit "false", so buildCookieOptions() can tell "not configured, infer
  // from NODE_ENV" apart from "explicitly overridden" (e.g. testing
  // NODE_ENV=production locally over plain HTTP, where a Secure cookie would
  // otherwise be silently dropped by the browser).
  COOKIE_SECURE: z.string().transform((val) => val === 'true').optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:8081'),

  // Verify.ET API
  VERIFY_ET_API_KEY: z.string().min(1, 'VERIFY_ET_API_KEY is required'),
  VERIFY_ET_BASE_URL: z.string().default('https://verify.et'),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),

  // SMTP / Brevo
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDER_EMAIL: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  VERIFY_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  VERIFY_RATE_LIMIT_MAX: z.coerce.number().default(20),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),

  // Super Admin
  SUPER_ADMIN_EMAIL: z.string().email().optional(),

  // Cloudinary Credentials
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
