import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { saleSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const customer_id = searchParams.get("customer_id");

  const supabase = createServerClient();

  let query = supabase
    .from("product_sales")
    .select(
      "*, products(id, name, image_urls), customers(id, name)"
    )
    .order("sold_at", { ascending: false });

  if (from) query = query.gte("sold_at", from);
  if (to) query = query.lte("sold_at", to);
  if (customer_id) query = query.eq("customer_id", customer_id);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = saleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "数据校验失败", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("product_sales")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 创建销售记录后，同步更新产品状态为已售
  await supabase
    .from("products")
    .update({
      sale_status: "sold",
      sold_at: parsed.data.sold_at ?? new Date().toISOString().slice(0, 10),
      settled_amount: parsed.data.sale_price,
    })
    .eq("id", parsed.data.product_id);

  return NextResponse.json({ data }, { status: 201 });
}
