import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { customerSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search");

  const supabase = createServerClient();
  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = customerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "数据校验失败", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
