"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Product, LooseStone } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type ItemType = "product" | "loose_stone";

export function LoanFormDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stones, setStones] = useState<LooseStone[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itemType, setItemType] = useState<ItemType>("product");
  const [itemId, setItemId] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerContact, setBorrowerContact] = useState("");
  const [loanedAt, setLoanedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/products?status=in_stock&limit=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) =>
        setProducts((j.data ?? []).filter((p: Product) => !p.is_loaned))
      );
    fetch("/api/loose-stones", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) =>
        setStones(
          (j.data ?? []).filter(
            (s: LooseStone) => s.sale_status !== "sold" && !s.is_loaned
          )
        )
      );
  }, [open]);

  function handleItemTypeChange(type: ItemType) {
    setItemType(type);
    setItemId("");
  }

  function reset() {
    setItemType("product");
    setItemId("");
    setBorrowerName("");
    setBorrowerContact("");
    setLoanedAt(new Date().toISOString().slice(0, 10));
    setDueAt("");
    setNotes("");
  }

  async function handleSubmit() {
    setError(null);
    if (!itemId) {
      setError(itemType === "product" ? "请选择产品" : "请选择裸石");
      return;
    }
    if (!borrowerName.trim()) {
      setError("请输入借出人");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: itemType === "product" ? itemId : null,
        loose_stone_id: itemType === "loose_stone" ? itemId : null,
        borrower_name: borrowerName.trim(),
        borrower_contact: borrowerContact || null,
        loaned_at: loanedAt,
        due_at: dueAt || null,
        notes: notes || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "保存失败");
      return;
    }
    reset();
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          登记借调
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>登记借调</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>物品类型</Label>
            <Select
              value={itemType}
              onValueChange={(v) => handleItemTypeChange(v as ItemType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">产品</SelectItem>
                <SelectItem value="loose_stone">裸石</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{itemType === "product" ? "产品 *" : "裸石 *"}</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    itemType === "product" ? "选择可借调产品" : "选择可借调裸石"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {itemType === "product" ? (
                  products.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      无可借调产品
                    </SelectItem>
                  ) : (
                    products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )
                ) : stones.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    无可借调裸石
                  </SelectItem>
                ) : (
                  stones.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.material || "裸石"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="borrower-name">借出人 *</Label>
              <Input
                id="borrower-name"
                value={borrowerName}
                maxLength={100}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="如：张三"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrower-contact">联系方式</Label>
              <Input
                id="borrower-contact"
                value={borrowerContact}
                maxLength={100}
                onChange={(e) => setBorrowerContact(e.target.value)}
                placeholder="电话 / 微信"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="loaned-at">借出日期</Label>
              <Input
                id="loaned-at"
                type="date"
                value={loanedAt}
                onChange={(e) => setLoanedAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-at">预计归还</Label>
              <Input
                id="due-at"
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-notes">备注</Label>
            <Textarea
              id="loan-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
