import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-public";

/**
 * 浏览器端 Supabase 客户端工厂。
 *
 * 显式传入 URL/Key（环境变量优先，缺失时回退到内置公开值），
 * 确保 Cloudflare Pages 等平台在未配置构建变量时也能正常预渲染与运行。
 */
export function createBrowserClient() {
  return createClientComponentClient({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
  });
}
