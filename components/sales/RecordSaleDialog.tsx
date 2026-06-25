"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Product, Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PAYMENT_METHODS = ["现金", "微信", "支付宝", "银行转账"];
const NO_CUSTOMER = "__none__";

export function RecordSaleDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState(NO_CUSTOMER);
  const [salePrice, setSalePrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [soldAt, setSoldAt] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    fetch("/api/products?status=in_stock&limit=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setProducts(j.data ?? []));
    fetch("/api/customers", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setCustomers(j.data ?? []));
  }, [open]);

  function handleProductChange(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p && !salePrice) setSalePrice(String(p.price));
  }

  async function handleSubmit() {
    setError(null);
    if (!productId) {
      setError("请选择产品");
      return;
    }
    if (!salePrice) {
      setError("请输入成交价");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        customer_id: customerId === NO_CUSTOMER ? null : customerId,
        sale_price: Number(salePrice),
        payment_method: paymentMethod || null,
        sold_at: soldAt,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "保存失败");
      return;
    }
    setProductId("");
    setCustomerId(NO_CUSTOMER);
    setSalePrice("");
    setPaymentMethod("");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          登记销售
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>登记销售</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>产品 *</Label>
            <Select value={productId} onValueChange={handleProductChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择在库产品" />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    无在库产品
                  </SelectItem>
                ) : (
                  products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}（¥{Number(p.price).toLocaleString()}）
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>客户</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="选择客户（可选）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CUSTOMER}>不指定客户</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale-price">成交价 (¥) *</Label>
            <Input
              id="sale-price"
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>付款方式</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="选择付款方式" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sold-at">成交时间</Label>
            <Input
              id="sold-at"
              type="date"
              value={soldAt}
              onChange={(e) => setSoldAt(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "保存中..." : "登记"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
