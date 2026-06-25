import Image from "next/image";
import { LooseStone } from "@/types";
import { formatCurrency, formatProductCode } from "@/lib/utils";
import { categoryLabel } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function LooseStoneCard({
  stone,
  onClick,
}: {
  stone: LooseStone;
  onClick?: () => void;
}) {
  const gemstone = categoryLabel(stone.gemstone_category);
  const unit = stone.weight_unit || "g";
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left"
    >
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* 裸石图片 */}
        <div className="relative aspect-square bg-gray-50">
          {stone.image_urls?.[0] ? (
            <Image
              src={stone.image_urls[0]}
              alt={stone.material ?? "裸石"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">
              💎
            </div>
          )}
        </div>
        {/* 裸石信息 */}
        <div className="p-4">
          <p className="mb-1 font-mono text-[11px] text-gray-400">
            {stone.code ?? formatProductCode("L", stone.created_at)}
          </p>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
              {stone.material || "未命名"}
            </h3>
            {stone.sale_status && stone.sale_status !== "in_stock" && (
              <StatusBadge status={stone.sale_status} />
            )}
          </div>
          <p className="mt-1 text-lg font-bold text-amber-700">
            {formatCurrency(stone.price)}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
            {gemstone && <span className="text-blue-600">{gemstone}</span>}
            {stone.size && <span>{stone.size}</span>}
            {stone.weight != null && (
              <span>
                {stone.weight}
                {unit}
              </span>
            )}
          </div>
          {(stone.is_used || stone.is_loaned) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stone.is_used && (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                  已用于产品
                </span>
              )}
              {stone.is_loaned && (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                  借调中
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
