import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Hosts and workspaces often export empty variables (`SMTP_USER=`). Treat an
// empty string as "not set" so defaults apply and optional checks stay honest.
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const optionalString = () => z.preprocess(emptyToUndefined, z.string().optional());

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  // Lead notification email (all optional: without SMTP_USER, SMTP_PASS and
  // LEAD_NOTIFY_EMAIL the API still works and just skips the notification).
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().default('smtp.gmail.com')),
  SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(465)),
  SMTP_USER: optionalString(),
  SMTP_PASS: optionalString(),
  LEAD_NOTIFY_EMAIL: optionalString(),
  ADMIN_LEADS_URL: z.preprocess(
    emptyToUndefined,
    z.string().default('https://larsenitaliana.com/admin/leads')
  ),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  // Throw rather than exit: on a serverless host process.exit() kills the
  // invocation before the reason reaches the logs.
  console.error('❌ Invalid environment variables:', error);
  throw error;
}

export default env;


