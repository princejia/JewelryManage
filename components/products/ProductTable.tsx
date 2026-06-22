import Link from "next/link";
import { Product } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>产品名称</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">价格</TableHead>
            <TableHead className="text-right">未结款</TableHead>
            <TableHead className="text-right">利润</TableHead>
            <TableHead>产地</TableHead>
            <TableHead>购入时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-400">
                暂无数据
              </TableCell>
            </TableRow>
          ) : (
            products.map((p) => (
              <TableRow key={p.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/products/${p.id}`}
                    className="font-medium text-gray-900 hover:text-amber-700"
                  >
                    {p.name}
                    {p.is_loose_stone && (
                      <span className="ml-2 text-xs text-blue-600">裸石</span>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.sale_status} />
                </TableCell>
                <TableCell className="text-right font-medium text-amber-700">
                  {formatCurrency(p.price)}
                </TableCell>
                <TableCell className="text-right">
                  {p.unsettled_amount > 0 ? (
                    <span className="text-red-500">
                      {formatCurrency(p.unsettled_amount)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-green-700">
                  {formatCurrency(p.profit)}
                </TableCell>
                <TableCell className="text-gray-600">
                  {p.origin || "-"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {formatDate(p.purchased_at)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
