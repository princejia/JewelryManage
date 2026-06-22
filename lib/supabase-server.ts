import { createClient } from "@supabase/supabase-js";

/**
 * 服务端 Supabase 客户端，使用 service role key。
 * 仅可在 API Routes / Server Components 中使用，切勿暴露给浏览器。
 */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
