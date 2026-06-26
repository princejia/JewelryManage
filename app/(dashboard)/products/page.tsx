"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List, Loader2, Download, QrCode } from "lucide-react";
import { Product, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductTable } from "@/components/products/ProductTable";
import { exportProductsToExcel } from "@/lib/export";
import { printLabels } from "@/lib/labels";
import { formatProductCode } from "@/lib/utils";
import {
  ProductFilters,
  ProductFilterState,
  DEFAULT_FILTERS,
} from "@/components/products/ProductFilters";

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);
  const [view, setView] = useState<"card" | "table">("card");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (filters.search) params.set("search", filters.search);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.is_loose_stone !== "all")
      params.set("is_loose_stone", filters.is_loose_stone);
    if (filters.price_min) params.set("price_min", filters.price_min);
    if (filters.price_max) params.set("price_max", filters.price_max);
    params.set("sort_by", filters.sort_by);
    params.set("order", filters.order);

    const res = await fetch(`/api/products?${params.toString()}`, {
      cache: "no-store",
    });
    const json: PaginatedResponse<Product> = await res.json();
    setProducts(json.data ?? []);
    setTotalPages(json.totalPages ?? 1);
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border bg-white">
            <button
              onClick={() => setView("card")}
              className={`flex items-center gap-1 px-3 py-2 text-sm ${
                view === "card" ? "bg-amber-100 text-amber-900" : "text-gray-500"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1 px-3 py-2 text-sm ${
                view === "table"
                  ? "bg-amber-100 text-amber-900"
                  : "text-gray-500"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button
            variant="outline"
            onClick={() => exportProductsToExcel(products)}
            disabled={products.length === 0}
          >
            <Download className="h-4 w-4" />
            导出 Excel
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              printLabels(
                products.map((p) => ({
                  id: p.id,
                  code: p.code ?? formatProductCode("P", p.created_at),
                  name: p.name,
                  type: "product" as const,
                })),
              )
            }
            disabled={products.length === 0}
          >
            <QrCode className="h-4 w-4" />
            打印标签
          </Button>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4" />
              新增产品
            </Link>
          </Button>
        </div>
      </div>
      <ProductFilters
        value={filters}
        onChange={(next) => {
          setPage(1);
          setFilters(next);
        }}
        onReset={() => {
          setPage(1);
          setFilters(DEFAULT_FILTERS);
        }}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : view === "card" ? (
        products.length === 0 ? (
          <p className="py-20 text-center text-gray-400">暂无产品</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )
      ) : (
        <ProductTable products={products} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
