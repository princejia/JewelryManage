import { SaleStatus } from "@/types";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  in_stock: { label: "在库", color: "bg-green-100 text-green-800" },
  sold: { label: "已售", color: "bg-gray-100 text-gray-600" },
  consignment: { label: "借售", color: "bg-yellow-100 text-yellow-800" },
};

export function StatusBadge({ status }: { status: SaleStatus | string }) {
  const { label, color } = STATUS_MAP[status] ?? {
    label: status,
    color: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}
