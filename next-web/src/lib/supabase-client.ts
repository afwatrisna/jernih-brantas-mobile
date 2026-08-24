"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase-types";

let browserClient: SupabaseClient<Database> | null | undefined;

/**
 * Returns the public browser client when its build-time configuration is present.
 * This client is intentionally limited by Supabase Row Level Security policies.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (browserClient !== undefined) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient<Database>(supabaseUrl, supabasePublishableKey, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return browserClient;
}
