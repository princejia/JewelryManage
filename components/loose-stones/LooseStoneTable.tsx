import { LooseStone } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatCurrency, formatDate, formatProductCode } from "@/lib/utils";
import { categoryLabel } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function LooseStoneTable({
  stones,
  onEdit,
  onDelete,
}: {
  stones: LooseStone[];
  onEdit: (stone: LooseStone) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>编号</TableHead>
            <TableHead>产品名称</TableHead>
            <TableHead>宝石分类</TableHead>
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
              <TableCell colSpan={8} className="text-center text-gray-400">
                暂无裸石
              </TableCell>
            </TableRow>
          ) : (
            stones.map((s) => (
              <TableRow key={s.id} className="cursor-pointer">
                <TableCell className="font-mono text-xs text-gray-500">
                  {s.code ?? formatProductCode("L", s.created_at)}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    className="font-medium text-gray-900 hover:text-amber-700"
                  >
                    {s.material || "未命名"}
                  </button>
                </TableCell>
                <TableCell>{categoryLabel(s.gemstone_category) || "-"}</TableCell>
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
                    onClick={() => onDelete(s.id)}
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
  );
}
