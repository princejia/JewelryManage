import Image from "next/image";
import { LooseStone } from "@/types";
import { formatCurrency, formatProductCode } from "@/lib/utils";
import { categoryLabel } from "@/lib/constants";

export function LooseStoneCard({
  stone,
  onClick,
}: {
  stone: LooseStone;
  onClick?: () => void;
}) {
  const gemstone = categoryLabel(stone.gemstone_category);
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
            {formatProductCode("L", stone.created_at)}
          </p>
          <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
            {stone.material || "未命名"}
          </h3>
          <p className="mt-1 text-lg font-bold text-amber-700">
            {formatCurrency(stone.price)}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
            {gemstone && <span className="text-blue-600">{gemstone}</span>}
            {stone.size && <span>{stone.size}</span>}
            {stone.weight != null && <span>{stone.weight}g</span>}
          </div>
        </div>
      </div>
    </button>
  );
}
