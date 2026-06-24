"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface LooseStoneFilterState {
  search: string;
  gemstone_category: string;
  price_min: string;
  price_max: string;
  sort_by: string;
  order: string;
}

export const DEFAULT_LS_FILTERS: LooseStoneFilterState = {
  search: "",
  gemstone_category: "",
  price_min: "",
  price_max: "",
  sort_by: "created_at",
  order: "desc",
};

interface LooseStoneFiltersProps {
  value: LooseStoneFilterState;
  onChange: (next: LooseStoneFilterState) => void;
  onReset: () => void;
}

export function LooseStoneFilters({
  value,
  onChange,
  onReset,
}: LooseStoneFiltersProps) {
  function update<K extends keyof LooseStoneFilterState>(
    key: K,
    v: LooseStoneFilterState[K]
  ) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        placeholder="搜索产品名称"
        value={value.search}
        onChange={(e) => update("search", e.target.value)}
      />

      <Input
        placeholder="宝石分类"
        value={value.gemstone_category}
        onChange={(e) => update("gemstone_category", e.target.value)}
      />

      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="最低价"
          value={value.price_min}
          onChange={(e) => update("price_min", e.target.value)}
        />
        <Input
          type="number"
          placeholder="最高价"
          value={value.price_max}
          onChange={(e) => update("price_max", e.target.value)}
        />
      </div>

      <Select value={value.sort_by} onValueChange={(v) => update("sort_by", v)}>
        <SelectTrigger>
          <SelectValue placeholder="排序字段" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">创建时间</SelectItem>
          <SelectItem value="price">价格</SelectItem>
        </SelectContent>
      </Select>

      <Select value={value.order} onValueChange={(v) => update("order", v)}>
        <SelectTrigger>
          <SelectValue placeholder="排序方向" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">降序</SelectItem>
          <SelectItem value="asc">升序</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onReset} className="lg:col-span-2">
        重置筛选
      </Button>
    </div>
  );
}
