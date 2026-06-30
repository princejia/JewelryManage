import { SignJWT, jwtVerify } from "jose";

/**
 * 自建用户名登录的会话工具（基于 JWT，Edge 运行时兼容）。
 *
 * 使用 jose 进行 HS256 签名 / 校验，可在 middleware（Edge）与
 * API Routes（Node）中通用。bcrypt 等仅 Node 可用的逻辑放在
 * lib/users.ts 中，切勿在此引入。
 */

export const AUTH_COOKIE = "auth_token";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 天

export type SessionPayload = {
  sub: string; // 用户 id
  username: string;
  role: string; // super_admin / user
};

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ??
    // 兜底密钥仅用于本地开发，生产请在环境变量配置 AUTH_SECRET
    "dev-only-insecure-secret-change-me-in-production-env";
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ username: payload.username, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.username !== "string") return null;
    return {
      sub: payload.sub,
      username: payload.username,
      role: typeof payload.role === "string" ? payload.role : "user",
    };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
