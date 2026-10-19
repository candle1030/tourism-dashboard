import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Dashboard는 Publishable Key로 "읽기"만 합니다. Secret Key는 절대 여기에 넣지 않습니다.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 없습니다. .env.local(로컬) 또는 Vercel Environment Variables에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 설정하세요."
    );
  }
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
