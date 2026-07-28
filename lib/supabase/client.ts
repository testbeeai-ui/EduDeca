"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env",
  );
}

/** Cookie-backed browser client — same Supabase project as Edubite / TestBee. */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: async (_name, _acquireTimeout, fn) => fn(),
  },
});
