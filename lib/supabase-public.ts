/**
 * 可公开的 Supabase 连接信息（URL + anon/publishable key）。
 *
 * 优先使用构建期注入的环境变量，缺失时回退到内置公开值，
 * 保证在未配置构建变量的平台（如 Cloudflare Pages）上也能正常工作。
 * 这些值本就会暴露在浏览器端，数据安全依赖 Supabase RLS；
 * 切勿在此放置 service_role 等服务端密钥。
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://nvckpnfininbedplstnb.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_St1Ow3qGu_BChFbmetqyGg_ncNalNV4";
