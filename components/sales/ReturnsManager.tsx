"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Undo2 } from "lucide-react";
import { ProductReturnWithRelations, ProductSaleWithRelations } from "@/types";
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
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

type ReturnForm = {
  sale_id: string;
  refund_amount: string;
  reason: string;
  returned_at: string;
};

const EMPTY: ReturnForm = {
  sale_id: "",
  refund_amount: "",
  reason: "",
  returned_at: today(),
};

export function ReturnsManager() {
  const router = useRouter();
  const [returns, setReturns] = useState<ProductReturnWithRelations[]>([]);
  const [sales, setSales] = useState<ProductSaleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductReturnWithRelations | null>(
    null
  );
  const [form, setForm] = useState<ReturnForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<ProductReturnWithRelations | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/returns", { cache: "no-store" });
    const json = await res.json();
    setReturns(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  async function loadSales() {
    const res = await fetch("/api/sales", { cache: "no-store" });
    const json = await res.json();
    setSales(json.data ?? []);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    loadSales();
    setOpen(true);
  }

  function openEdit(r: ProductReturnWithRelations) {
    setEditing(r);
    setForm({
      sale_id: r.sale_id ?? "",
      refund_amount: String(r.refund_amount ?? ""),
      reason: r.reason ?? "",
      returned_at: r.returned_at ?? today(),
    });
    setError(null);
    loadSales();
    setOpen(true);
  }

  function handleSaleChange(saleId: string) {
    const sale = sales.find((s) => s.id === saleId);
    setForm((prev) => ({
      ...prev,
      sale_id: saleId,
      refund_amount:
        prev.refund_amount || (sale ? String(sale.sale_price) : ""),
    }));
  }

  async function handleSave() {
    setError(null);
    if (!editing && !form.sale_id) {
      setError("请选择需要退货的销售记录");
      return;
    }
    if (!form.refund_amount) {
      setError("请输入退款金额");
      return;
    }
    setSaving(true);

    const sale = sales.find((s) => s.id === form.sale_id);
    const payload = editing
      ? {
          refund_amount: Number(form.refund_amount),
          reason: form.reason || null,
          returned_at: form.returned_at,
        }
      : {
          sale_id: form.sale_id,
          product_id: sale?.product_id ?? null,
          customer_id: sale?.customer_id ?? null,
          refund_amount: Number(form.refund_amount),
          reason: form.reason || null,
          returned_at: form.returned_at,
        };

    const res = await fetch(
      editing ? `/api/returns/${editing.id}` : "/api/returns",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "保存失败");
      return;
    }
    setOpen(false);
    setEditing(null);
    fetchReturns();
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/returns/${deleteTarget.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (res.ok) {
      setDeleteTarget(null);
      fetchReturns();
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Undo2 className="h-4 w-4" />
          退货记录
        </CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          登记退货
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>产品</TableHead>
                <TableHead>客户</TableHead>
                <TableHead className="text-right">退款金额</TableHead>
                <TableHead>原因</TableHead>
                <TableHead>退货时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400">
                    暂无退货记录
                  </TableCell>
                </TableRow>
              ) : (
                returns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.products?.name ?? "已删除产品"}
                    </TableCell>
                    <TableCell>{r.customers?.name ?? "-"}</TableCell>
                    <TableCell className="text-right font-medium text-red-500">
                      {formatCurrency(r.refund_amount)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-gray-500">
                      {r.reason || "-"}
                    </TableCell>
                    <TableCell>{formatDate(r.returned_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "编辑退货" : "登记退货"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {editing ? (
              <div className="space-y-2">
                <Label>退货产品</Label>
                <div className="flex h-10 items-center rounded-md border bg-gray-50 px-3 text-sm text-gray-700">
                  {editing.products?.name ?? "已删除产品"}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>销售记录 *</Label>
                <Select value={form.sale_id} onValueChange={handleSaleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择需要退货的销售记录" />
                  </SelectTrigger>
                  <SelectContent>
                    {sales.length === 0 ? (
                      <SelectItem value="__empty__" disabled>
                        暂无销售记录
                      </SelectItem>
                    ) : (
                      sales.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {(s.products?.name ?? "已删除产品") +
                            "（¥" +
                            Number(s.sale_price).toLocaleString() +
                            " · " +
                            formatDate(s.sold_at) +
                            "）"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="r-amount">退款金额 (¥) *</Label>
              <Input
                id="r-amount"
                type="number"
                step="0.01"
                value={form.refund_amount}
                onChange={(e) =>
                  setForm({ ...form, refund_amount: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-reason">退货原因</Label>
              <Textarea
                id="r-reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="如：尺寸不合适、质量问题"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-date">退货时间</Label>
              <Input
                id="r-date"
                type="date"
                value={form.returned_at}
                onChange={(e) =>
                  setForm({ ...form, returned_at: e.target.value })
                }
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="确认删除该退货记录？"
        description="此操作不可撤销。删除后不会自动改变产品状态。"
        confirmText="确认删除"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
