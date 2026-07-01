import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { createServerClient } from "@/lib/supabase-server";
import { Product } from "@/types";
import { Gallery } from "@/app/v/[type]/[id]/Gallery";
import { BackButton } from "@/components/products/BackButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { categoryLabel } from "@/lib/constants";
import { formatCurrency, formatDate, formatProductCode } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Field = { label: string; value: string | null | undefined };

export default async function ProductViewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const product = data as Product;

  const fields: Field[] = [
    {
      label: "重量",
      value:
        product.total_weight != null
          ? `${product.total_weight}${product.weight_unit || "g"}`
          : null,
    },
    { label: "尺寸", value: product.size },
    { label: "产地", value: product.origin },
    { label: "宝石分类", value: categoryLabel(product.gemstone_category) },
    { label: "功能分类", value: categoryLabel(product.function_category) },
    { label: "镶嵌配石", value: product.inlaid_stones },
    { label: "价格", value: formatCurrency(product.price) },
    { label: "进货价", value: formatCurrency(product.purchase_price) },
    { label: "出售价", value: formatCurrency(product.sale_price) },
    { label: "利润", value: formatCurrency(product.profit) },
    { label: "购入时间", value: formatDate(product.purchased_at) },
    { label: "出售时间", value: formatDate(product.sold_at) },
    { label: "备注", value: product.notes },
  ];

  const visible = fields.filter((f) => f.value);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackButton />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <StatusBadge status={product.sale_status} />
          </div>
          <p className="mt-1 font-mono text-sm text-gray-400">
            编号：{product.code ?? formatProductCode("P", product.created_at)}
          </p>
        </div>
        <Link
          href={`/products/${product.id}`}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Pencil className="h-4 w-4" />
          编辑
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <Gallery images={product.image_urls ?? []} title={product.name} />

        <div className="p-6">
          {visible.length > 0 && (
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {visible.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs text-gray-400">{f.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-800">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
