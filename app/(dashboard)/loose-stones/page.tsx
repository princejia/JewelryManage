"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, LayoutGrid, List, Loader2 } from "lucide-react";
import { LooseStone } from "@/types";
import { Button } from "@/components/ui/button";
import { LooseStoneCard } from "@/components/loose-stones/LooseStoneCard";
import { LooseStoneTable } from "@/components/loose-stones/LooseStoneTable";
import { LooseStoneFormDialog } from "@/components/loose-stones/LooseStoneFormDialog";
import {
  LooseStoneFilters,
  LooseStoneFilterState,
  DEFAULT_LS_FILTERS,
} from "@/components/loose-stones/LooseStoneFilters";

export default function LooseStonesPage() {
  const [filters, setFilters] =
    useState<LooseStoneFilterState>(DEFAULT_LS_FILTERS);
  const [view, setView] = useState<"card" | "table">("card");
  const [stones, setStones] = useState<LooseStone[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LooseStone | null>(null);

  const fetchStones = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.gemstone_category)
      params.set("gemstone_category", filters.gemstone_category);
    if (filters.price_min) params.set("price_min", filters.price_min);
    if (filters.price_max) params.set("price_max", filters.price_max);
    params.set("sort_by", filters.sort_by);
    params.set("order", filters.order);

    const res = await fetch(`/api/loose-stones?${params.toString()}`);
    const json = await res.json();
    setStones(json.data ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchStones, 300);
    return () => clearTimeout(t);
  }, [fetchStones]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(stone: LooseStone) {
    setEditing(stone);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这颗裸石？")) return;
    const res = await fetch(`/api/loose-stones/${id}`, { method: "DELETE" });
    if (res.ok) fetchStones();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">裸石管理</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border bg-white">
            <button
              onClick={() => setView("card")}
              className={`flex items-center gap-1 px-3 py-2 text-sm ${
                view === "card"
                  ? "bg-amber-100 text-amber-900"
                  : "text-gray-500"
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
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            新增裸石
          </Button>
        </div>
      </div>

      <LooseStoneFilters
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_LS_FILTERS)}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : view === "card" ? (
        stones.length === 0 ? (
          <p className="py-20 text-center text-gray-400">暂无裸石</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {stones.map((s) => (
              <LooseStoneCard
                key={s.id}
                stone={s}
                onClick={() => openEdit(s)}
              />
            ))}
          </div>
        )
      ) : (
        <LooseStoneTable
          stones={stones}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <LooseStoneFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={fetchStones}
      />
    </div>
  );
}
