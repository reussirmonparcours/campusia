import { z } from "zod";

/**
 * Public client environment schema.
 * Only variables with NEXT_PUBLIC_ prefix should be listed here.
 * These are safe to be exposed to the browser.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL (e.g. https://your-project.supabase.co)")
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

/**
 * Server-only environment schema.
 * These variables MUST NEVER be bundled or transmitted to the client.
 */
export const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required on the server for admin operations"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates and retrieves public client environment variables.
 * Safe to call from client and server components.
 */
export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(
      `[MonParcours Env] Invalid client configuration. Please verify your environment variables:\n${issues}`
    );
  }

  return parsed.data;
}

/**
 * Validates and retrieves server environment variables.
 * MUST only be invoked in server contexts.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("[MonParcours Security] getServerEnv() cannot be called from the client browser.");
  }

  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(
      `[MonParcours Env] Invalid server configuration. Please verify your server environment variables:\n${issues}`
    );
  }

  return parsed.data;
}

/**
 * Non-throwing environment check utility to inspect configuration status
 * without exposing raw secrets.
 */
export function checkConfigStatus() {
  const hasClientUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasClientAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServerServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return {
    isClientConfigured: hasClientUrl && hasClientAnonKey,
    isServerConfigured: hasClientUrl && hasClientAnonKey && hasServerServiceRole,
  };
}
