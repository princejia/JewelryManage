import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase-public";

/**
 * 服务端 Supabase 客户端，使用 service role key。
 * 仅可在 API Routes / Server Components 中使用，切勿暴露给浏览器。
 *
 * URL 使用公开兜底值；service role key 为密钥，必须由运行时环境变量提供
 * （Cloudflare Pages 需在环境变量中配置 SUPABASE_SERVICE_ROLE_KEY）。
 */
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量，请在部署平台的环境变量中配置。"
    );
  }

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
