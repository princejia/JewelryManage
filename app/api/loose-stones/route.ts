import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { looseStoneSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const gemstone = searchParams.get("gemstone_category");
  const search = searchParams.get("search");
  const price_min = searchParams.get("price_min");
  const price_max = searchParams.get("price_max");
  const sort_by = searchParams.get("sort_by") || "created_at";
  const order = searchParams.get("order") || "desc";

  const allowedSort = ["price", "created_at"];
  const sortColumn = allowedSort.includes(sort_by) ? sort_by : "created_at";

  const supabase = createServerClient();
  let query = supabase.from("loose_stones").select("*");

  if (gemstone) query = query.ilike("gemstone_category", `%${gemstone}%`);
  if (search) {
    const safe = search.replace(/[,()*]/g, "");
    query = query.or(`material.ilike.%${safe}%,code.ilike.%${safe}%`);
  }
  if (price_min) query = query.gte("price", Number(price_min));
  if (price_max) query = query.lte("price", Number(price_max));

  query = query.order(sortColumn, { ascending: order === "asc" });

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 附加派生状态：是否已被产品使用 / 是否存在未归还的借调记录
  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id as string);
    const [{ data: usedProducts }, { data: loans }] = await Promise.all([
      supabase
        .from("products")
        .select("source_loose_stone_id")
        .in("source_loose_stone_id", ids),
      supabase
        .from("item_loans")
        .select("loose_stone_id")
        .is("returned_at", null)
        .in("loose_stone_id", ids),
    ]);
    const usedSet = new Set(
      (usedProducts ?? []).map((p) => p.source_loose_stone_id)
    );
    const loanedSet = new Set((loans ?? []).map((l) => l.loose_stone_id));
    rows.forEach((r) => {
      r.is_used = usedSet.has(r.id);
      r.is_loaned = loanedSet.has(r.id);
    });
  }

  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = looseStoneSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "数据校验失败", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("loose_stones")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
