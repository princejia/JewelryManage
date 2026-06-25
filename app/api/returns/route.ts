import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { returnSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const customer_id = searchParams.get("customer_id");

  const supabase = createServerClient();

  let query = supabase
    .from("product_returns")
    .select("*, products(id, name, image_urls), customers(id, name)")
    .order("returned_at", { ascending: false });

  if (from) query = query.gte("returned_at", from);
  if (to) query = query.lte("returned_at", to);
  if (customer_id) query = query.eq("customer_id", customer_id);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = returnSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "数据校验失败", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("product_returns")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 退货后将产品恢复为在库状态，以便重新销售
  if (parsed.data.product_id) {
    await supabase
      .from("products")
      .update({
        sale_status: "in_stock",
        sold_at: null,
        settled_amount: 0,
      })
      .eq("id", parsed.data.product_id);
  }

  return NextResponse.json({ data }, { status: 201 });
}
