import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase-server";
import { AUTH_COOKIE, verifySession, SessionPayload } from "@/lib/auth";

/**
 * 服务端账号工具（依赖 bcrypt，仅可在 Node 运行时的 API Routes /
 * Server Components 中使用，切勿在 middleware/Edge 引入）。
 */

const BCRYPT_ROUNDS = 10;

export type AppUser = {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** 读取当前请求的登录会话（来自 httpOnly cookie 中的 JWT）。 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  return verifySession(token);
}

/** 校验当前用户为超级管理员，否则返回 null。 */
export async function requireSuperAdmin(): Promise<SessionPayload | null> {
  const session = await getCurrentSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

/**
 * 兜底创建初始超级管理员：当 app_users 表为空时，
 * 自动写入 princejia@gmail.com / 123456，确保首次可登录。
 */
export async function ensureSeedAdmin(): Promise<void> {
  const supabase = createServerClient();
  const { count } = await supabase
    .from("app_users")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;
  const password_hash = await hashPassword("123456");
  await supabase.from("app_users").insert({
    username: "princejia@gmail.com",
    password_hash,
    role: "super_admin",
  });
}
