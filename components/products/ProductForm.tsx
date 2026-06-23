"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LooseStone, Product, ProductInput, SaleStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { formatCurrency } from "@/lib/utils";
import {
  GEMSTONE_CATEGORY_LABEL,
  GEMSTONE_CATEGORY_OPTIONS,
  PRODUCT_FUNCTION_OPTIONS,
} from "@/lib/constants";

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
    size: p?.size ?? "",
    origin: p?.origin ?? "",
    inlaid_stones: p?.inlaid_stones ?? "",
    gemstone_category: p?.gemstone_category ?? null,
    function_category: p?.function_category ?? null,
    source_loose_stone_id: p?.source_loose_stone_id ?? null,
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
  const [fromLooseStone, setFromLooseStone] = useState(
    !!initial?.source_loose_stone_id
  );
  const [looseStones, setLooseStones] = useState<LooseStone[]>([]);

  useEffect(() => {
    if (!fromLooseStone || looseStones.length > 0) return;
    fetch("/api/loose-stones")
      .then((res) => res.json())
      .then((json) => setLooseStones(json.data ?? []))
      .catch(() => setLooseStones([]));
  }, [fromLooseStone, looseStones.length]);

  const unsettled = Number(form.price || 0) - Number(form.settled_amount || 0);
  const profit = Number(form.price || 0) - Number(form.purchase_price || 0);

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFromLooseStoneToggle(checked: boolean) {
    setFromLooseStone(checked);
    if (!checked) set("source_loose_stone_id", null);
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
      size: form.size || null,
      origin: form.origin || null,
      inlaid_stones: form.inlaid_stones || null,
      gemstone_category: form.gemstone_category || null,
      function_category: form.function_category || null,
      source_loose_stone_id: fromLooseStone
        ? form.source_loose_stone_id || null
        : null,
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
          <Label htmlFor="size">尺寸</Label>
          <Input
            id="size"
            value={form.size ?? ""}
            onChange={(e) => set("size", e.target.value)}
            placeholder="如：12号 / 18cm"
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
          <Label>宝石分类</Label>
          <Select
            value={form.gemstone_category ?? ""}
            onValueChange={(v) =>
              set(
                "gemstone_category",
                (v || null) as ProductInput["gemstone_category"]
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="选择宝石分类" />
            </SelectTrigger>
            <SelectContent>
              {GEMSTONE_CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>功能分类</Label>
          <Select
            value={form.function_category ?? ""}
            onValueChange={(v) =>
              set(
                "function_category",
                (v || null) as ProductInput["function_category"]
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="选择功能分类" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_FUNCTION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* 从现有裸石生产 */}
      <div className="space-y-3 rounded-md border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Switch
            checked={fromLooseStone}
            onCheckedChange={handleFromLooseStoneToggle}
            id="from_loose_stone"
          />
          <Label htmlFor="from_loose_stone">从现有裸石生产</Label>
        </div>
        {fromLooseStone && (
          <div className="space-y-2">
            <Label>选择裸石</Label>
            <Select
              value={form.source_loose_stone_id ?? ""}
              onValueChange={(v) => set("source_loose_stone_id", v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择一颗裸石" />
              </SelectTrigger>
              <SelectContent>
                {looseStones.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-400">
                    暂无裸石数据
                  </div>
                ) : (
                  looseStones.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {[
                        s.gemstone_category
                          ? GEMSTONE_CATEGORY_LABEL[s.gemstone_category]
                          : null,
                        s.material,
                        s.size,
                        s.weight != null ? `${s.weight}g` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "裸石"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
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
