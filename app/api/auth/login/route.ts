import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase-server";
import {
  ensureSeedAdmin,
  verifyPassword,
  AppUser,
} from "@/lib/users";
import { signSession, AUTH_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z.string().trim().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }

  // 首次运行兜底创建超级管理员
  await ensureSeedAdmin();

  const supabase = createServerClient();
  const { data } = await supabase
    .from("app_users")
    .select("*")
    .eq("username", parsed.data.username)
    .maybeSingle();
  const user = data as AppUser | null;

  // 统一错误信息，避免暴露用户名是否存在
  const invalid = NextResponse.json(
    { error: "用户名或密码错误" },
    { status: 401 }
  );

  if (!user || !user.is_active) return invalid;

  const ok = await verifyPassword(parsed.data.password, user.password_hash);
  if (!ok) return invalid;

  const token = await signSession({
    sub: user.id,
    username: user.username,
    role: user.role,
  });

  const res = NextResponse.json({
    user: { id: user.id, username: user.username, role: user.role },
  });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
