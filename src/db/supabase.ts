import { createClient } from "@supabase/supabase-js";
import { env, requireCliEnv } from "@/src/config/env";

export function createServiceClient() {
  requireCliEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  return createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function hasServiceEnv() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createBrowserClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}
