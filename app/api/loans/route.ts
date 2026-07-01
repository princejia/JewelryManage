import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { loanSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status"); // active | returned | all

  const supabase = createServerClient();
  let query = supabase
    .from("item_loans")
    .select(
      "*, products(id, name, image_urls), loose_stones(id, material, image_urls)"
    )
    .order("loaned_at", { ascending: false });

  if (status === "active") query = query.is("returned_at", null);
  if (status === "returned") query = query.not("returned_at", "is", null);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loanSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "数据校验失败", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // 校验：已售物品不可借调，且不可重复借调
  if (parsed.data.product_id) {
    const { data: product } = await supabase
      .from("products")
      .select("sale_status")
      .eq("id", parsed.data.product_id)
      .single();
    if (product && product.sale_status !== "in_stock") {
      return NextResponse.json(
        { error: "该产品已售出，无法借调" },
        { status: 400 }
      );
    }
    const { data: activeLoan } = await supabase
      .from("item_loans")
      .select("id")
      .eq("product_id", parsed.data.product_id)
      .is("returned_at", null)
      .maybeSingle();
    if (activeLoan) {
      return NextResponse.json(
        { error: "该产品正在借调中" },
        { status: 400 }
      );
    }
  } else if (parsed.data.loose_stone_id) {
    const { data: stone } = await supabase
      .from("loose_stones")
      .select("sale_status")
      .eq("id", parsed.data.loose_stone_id)
      .single();
    if (stone && stone.sale_status === "sold") {
      return NextResponse.json(
        { error: "该裸石已售出，无法借调" },
        { status: 400 }
      );
    }
    const { data: activeLoan } = await supabase
      .from("item_loans")
      .select("id")
      .eq("loose_stone_id", parsed.data.loose_stone_id)
      .is("returned_at", null)
      .maybeSingle();
    if (activeLoan) {
      return NextResponse.json(
        { error: "该裸石正在借调中" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("item_loans")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
