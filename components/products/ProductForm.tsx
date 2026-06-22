"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductInput, SaleStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { formatCurrency } from "@/lib/utils";

const ORIGIN_PRESETS = ["深圳水贝", "香港", "广州番禺", "周大福", "其他"];

const STATUS_OPTIONS: { value: SaleStatus; label: string }[] = [
  { value: "in_stock", label: "在库" },
  { value: "sold", label: "已售" },
  { value: "consignment", label: "借售" },
];

interface ProductFormProps {
  initial?: Product;
}

function toFormState(p?: Product): ProductInput {
  return {
    image_urls: p?.image_urls ?? [],
    name: p?.name ?? "",
    total_weight: p?.total_weight ?? null,
    origin: p?.origin ?? "",
    inlaid_stones: p?.inlaid_stones ?? "",
    price: p?.price ?? 0,
    purchase_price: p?.purchase_price ?? 0,
    sale_status: p?.sale_status ?? "in_stock",
    settled_amount: p?.settled_amount ?? 0,
    is_consignment: p?.is_consignment ?? false,
    is_loose_stone: p?.is_loose_stone ?? false,
    purchased_at: p?.purchased_at ?? null,
    sold_at: p?.sold_at ?? null,
    notes: p?.notes ?? "",
  };
}

export function ProductForm({ initial }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>(toFormState(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unsettled = Number(form.price || 0) - Number(form.settled_amount || 0);
  const profit = Number(form.price || 0) - Number(form.purchase_price || 0);

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleStatusChange(status: SaleStatus) {
    setForm((prev) => ({
      ...prev,
      sale_status: status,
      is_consignment: status === "consignment",
      sold_at:
        status !== "in_stock" && !prev.sold_at
          ? new Date().toISOString().slice(0, 10)
          : prev.sold_at,
    }));
  }

  function handleConsignmentToggle(checked: boolean) {
    setForm((prev) => ({
      ...prev,
      is_consignment: checked,
      sale_status: checked ? "consignment" : "in_stock",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("产品名称必填");
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      total_weight:
        form.total_weight === null || (form.total_weight as unknown) === ""
          ? null
          : Number(form.total_weight),
      price: Number(form.price),
      purchase_price: Number(form.purchase_price),
      settled_amount: Number(form.settled_amount),
      origin: form.origin || null,
      inlaid_stones: form.inlaid_stones || null,
      notes: form.notes || null,
      purchased_at: form.purchased_at || null,
      sold_at: form.sold_at || null,
    };

    const url = initial ? `/api/products/${initial.id}` : "/api/products";
    const method = initial ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "保存失败");
      return;
    }

    router.push("/products");
    router.refresh();
  }

  const showSoldDate = form.sale_status !== "in_stock";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 图片 */}
      <div className="space-y-2">
        <Label>产品图片</Label>
        <ImageUpload
          value={form.image_urls}
          onChange={(urls) => set("image_urls", urls)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">产品名称 *</Label>
          <Input
            id="name"
            value={form.name}
            maxLength={255}
            onChange={(e) => set("name", e.target.value)}
            placeholder="如：18K金钻石戒指"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_weight">总重量 (g)</Label>
          <Input
            id="total_weight"
            type="number"
            step="0.001"
            value={form.total_weight ?? ""}
            onChange={(e) =>
              set(
                "total_weight",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="origin">产地</Label>
          <Input
            id="origin"
            list="origin-presets"
            value={form.origin ?? ""}
            onChange={(e) => set("origin", e.target.value)}
            placeholder="如：深圳水贝"
          />
          <datalist id="origin-presets">
            {ORIGIN_PRESETS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="inlaid_stones">镶嵌配石</Label>
          <Textarea
            id="inlaid_stones"
            value={form.inlaid_stones ?? ""}
            onChange={(e) => set("inlaid_stones", e.target.value)}
            placeholder="如：主石1ct D/VVS1，配石0.3ct"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">价格 (¥) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => set("price", Number(e.target.value))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_price">进货价 (¥)</Label>
          <Input
            id="purchase_price"
            type="number"
            step="0.01"
            value={form.purchase_price}
            onChange={(e) => set("purchase_price", Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settled_amount">结款 (¥)</Label>
          <Input
            id="settled_amount"
            type="number"
            step="0.01"
            value={form.settled_amount}
            onChange={(e) => set("settled_amount", Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label>未结款 (¥)</Label>
          <div
            className={`flex h-10 items-center rounded-md border bg-gray-50 px-3 text-sm font-medium ${
              unsettled > 0 ? "text-red-500" : "text-gray-500"
            }`}
          >
            {formatCurrency(unsettled)}
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>利润 (¥)</Label>
          <div className="flex h-10 items-center rounded-md border bg-green-50 px-3 text-sm font-medium text-green-700">
            {formatCurrency(profit)}
          </div>
        </div>
      </div>

      {/* 销售状态 */}
      <div className="space-y-2">
        <Label>销售情况</Label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                form.sale_status === opt.value
                  ? "border-amber-500 bg-amber-100 text-amber-900"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 开关 */}
      <div className="flex flex-wrap gap-8">
        <div className="flex items-center gap-3">
          <Switch
            checked={form.is_consignment}
            onCheckedChange={handleConsignmentToggle}
            id="is_consignment"
          />
          <Label htmlFor="is_consignment">借售</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.is_loose_stone}
            onCheckedChange={(v) => set("is_loose_stone", v)}
            id="is_loose_stone"
          />
          <Label htmlFor="is_loose_stone">裸石</Label>
        </div>
      </div>

      {/* 日期 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="purchased_at">购入时间</Label>
          <Input
            id="purchased_at"
            type="date"
            value={form.purchased_at ?? ""}
            onChange={(e) => set("purchased_at", e.target.value || null)}
          />
        </div>
        {showSoldDate && (
          <div className="space-y-2">
            <Label htmlFor="sold_at">出售时间</Label>
            <Input
              id="sold_at"
              type="date"
              value={form.sold_at ?? ""}
              onChange={(e) => set("sold_at", e.target.value || null)}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea
          id="notes"
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "保存中..." : initial ? "保存修改" : "创建产品"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
