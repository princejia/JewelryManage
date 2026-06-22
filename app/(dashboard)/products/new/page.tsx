import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/products/ProductForm";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        返回产品列表
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">新增产品</h1>
      <div className="rounded-xl border bg-white p-6">
        <ProductForm />
      </div>
    </div>
  );
}
