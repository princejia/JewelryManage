"use client";

import { useEffect, useState } from "react";
import { LooseStone } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/Combobox";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GEMSTONE_CATEGORY_SUGGESTIONS } from "@/lib/constants";

type FormState = {
  image_urls: string[];
  material: string;
  gemstone_category: string;
  size: string;
  weight: string;
  price: string;
  notes: string;
};

function toFormState(s?: LooseStone | null): FormState {
  return {
    image_urls: s?.image_urls ?? [],
    material: s?.material ?? "",
    gemstone_category: s?.gemstone_category ?? "",
    size: s?.size ?? "",
    weight: s?.weight != null ? String(s.weight) : "",
    price: s?.price != null ? String(s.price) : "",
    notes: s?.notes ?? "",
  };
}

interface LooseStoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: LooseStone | null;
  onSaved: () => void;
}

export function LooseStoneFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: LooseStoneFormDialogProps) {
  const [form, setForm] = useState<FormState>(toFormState(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gemstoneOptions, setGemstoneOptions] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setForm(toFormState(initial));
      setError(null);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/options")
      .then((res) => res.json())
      .then((json) => setGemstoneOptions(json.gemstone_category ?? []))
      .catch(() => {});
  }, [open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setError(null);
    setSaving(true);

    const payload = {
      image_urls: form.image_urls,
      material: form.material || null,
      gemstone_category: form.gemstone_category || null,
      size: form.size || null,
      weight: form.weight === "" ? null : Number(form.weight),
      price: form.price === "" ? 0 : Number(form.price),
      notes: form.notes || null,
    };

    const url = initial
      ? `/api/loose-stones/${initial.id}`
      : "/api/loose-stones";
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

    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "编辑裸石" : "新增裸石"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>裸石图片</Label>
            <ImageUpload
              value={form.image_urls}
              onChange={(urls) => set("image_urls", urls)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ls-material">产品名称</Label>
            <Input
              id="ls-material"
              value={form.material}
              maxLength={100}
              onChange={(e) => set("material", e.target.value)}
              placeholder="如：天然翡翠、矢车菊蓝宝"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ls-gemstone">宝石分类</Label>
            <Combobox
              id="ls-gemstone"
              value={form.gemstone_category}
              onChange={(v) => set("gemstone_category", v)}
              options={[...GEMSTONE_CATEGORY_SUGGESTIONS, ...gemstoneOptions]}
              placeholder="输入或选择宝石分类"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ls-size">尺寸</Label>
            <Input
              id="ls-size"
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
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
              onChange={(e) => set("weight", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ls-price">价格 (¥)</Label>
            <Input
              id="ls-price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ls-notes">备注</Label>
            <Textarea
              id="ls-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
