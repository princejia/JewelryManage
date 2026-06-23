import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* 产品图片 */}
        <div className="relative aspect-square bg-gray-50">
          {product.image_urls?.[0] ? (
            <Image
              src={product.image_urls[0]}
              alt={product.name}
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
        {/* 产品信息 */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
              {product.name}
            </h3>
            <StatusBadge status={product.sale_status} />
          </div>
          <p className="mt-1 text-lg font-bold text-amber-700">
            {formatCurrency(product.price)}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
            {product.total_weight != null && (
              <span>{product.total_weight}g</span>
            )}
            {product.size && <span>{product.size}</span>}
            {product.origin && <span>{product.origin}</span>}
            {product.is_loose_stone && (
              <span className="text-blue-600">裸石</span>
            )}
          </div>
          {product.unsettled_amount > 0 && (
            <p className="mt-1 text-xs text-red-500">
              未结款：{formatCurrency(product.unsettled_amount)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
