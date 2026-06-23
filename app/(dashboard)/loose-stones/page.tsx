"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { LooseStone, GemstoneCategory } from "@/types";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  GEMSTONE_CATEGORY_LABEL,
  GEMSTONE_CATEGORY_OPTIONS,
} from "@/lib/constants";

type FormState = {
  size: string;
  material: string;
  weight: string;
  price: string;
  gemstone_category: GemstoneCategory | "";
  notes: string;
};

const EMPTY_FORM: FormState = {
  size: "",
  material: "",
  weight: "",
  price: "",
  gemstone_category: "",
  notes: "",
};

export default function LooseStonesPage() {
  const [stones, setStones] = useState<LooseStone[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const fetchStones = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/loose-stones");
    const json = await res.json();
    setStones(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStones();
  }, [fetchStones]);

  async function handleCreate() {
    setError(null);
    setSaving(true);
    const res = await fetch("/api/loose-stones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        size: form.size || null,
        material: form.material || null,
        weight: form.weight === "" ? null : Number(form.weight),
        price: form.price === "" ? 0 : Number(form.price),
        gemstone_category: form.gemstone_category || null,
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "保存失败");
      return;
    }
    setForm(EMPTY_FORM);
    setOpen(false);
    fetchStones();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这颗裸石？")) return;
    const res = await fetch(`/api/loose-stones/${id}`, { method: "DELETE" });
    if (res.ok) fetchStones();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">裸石管理</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              新增裸石
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增裸石</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>宝石分类</Label>
                <Select
                  value={form.gemstone_category}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      gemstone_category: v as GemstoneCategory,
                    })
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
                <Label htmlFor="ls-material">材质</Label>
                <Input
                  id="ls-material"
                  value={form.material}
                  onChange={(e) =>
                    setForm({ ...form, material: e.target.value })
                  }
                  placeholder="如：天然翡翠、矢车菊蓝宝"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ls-size">尺寸</Label>
                <Input
                  id="ls-size"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="如：10×8mm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ls-weight">克重 (g)</Label>
                <Input
                  id="ls-weight"
                  type="number"
                  step="0.001"
                  value={form.weight}
                  onChange={(e) =>
                    setForm({ ...form, weight: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ls-price">价格 (¥)</Label>
                <Input
                  id="ls-price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ls-notes">备注</Label>
                <Textarea
                  id="ls-notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>宝石分类</TableHead>
                <TableHead>材质</TableHead>
                <TableHead>尺寸</TableHead>
                <TableHead className="text-right">克重</TableHead>
                <TableHead className="text-right">价格</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400">
                    暂无裸石
                  </TableCell>
                </TableRow>
              ) : (
                stones.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.gemstone_category
                        ? GEMSTONE_CATEGORY_LABEL[s.gemstone_category]
                        : "-"}
                    </TableCell>
                    <TableCell>{s.material || "-"}</TableCell>
                    <TableCell>{s.size || "-"}</TableCell>
                    <TableCell className="text-right">
                      {s.weight != null ? `${s.weight}g` : "-"}
                    </TableCell>
                    <TableCell className="text-right text-amber-700">
                      {formatCurrency(s.price)}
                    </TableCell>
                    <TableCell>{formatDate(s.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
