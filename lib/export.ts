import * as XLSX from "xlsx";
import { Product } from "@/types";
import {
  GEMSTONE_CATEGORY_LABEL,
  PRODUCT_FUNCTION_LABEL,
} from "@/lib/constants";

const STATUS_LABEL: Record<string, string> = {
  in_stock: "在库",
  sold: "已售",
  consignment: "借售",
};

/** 将产品列表导出为 Excel 文件并触发下载 */
export function exportProductsToExcel(products: Product[], filename?: string) {
  const rows = products.map((p) => ({
    产品名称: p.name,
    销售状态: STATUS_LABEL[p.sale_status] ?? p.sale_status,
    "价格(¥)": Number(p.price),
    "进货价(¥)": Number(p.purchase_price),
    "利润(¥)": Number(p.profit),
    "结款(¥)": Number(p.settled_amount),
    "未结款(¥)": Number(p.unsettled_amount),
    "总重量(g)": p.total_weight ?? "",
    尺寸: p.size ?? "",
    宝石分类: p.gemstone_category
      ? GEMSTONE_CATEGORY_LABEL[p.gemstone_category]
      : "",
    功能分类: p.function_category
      ? PRODUCT_FUNCTION_LABEL[p.function_category]
      : "",
    产地: p.origin ?? "",
    镶嵌配石: p.inlaid_stones ?? "",
    裸石: p.is_loose_stone ? "是" : "否",
    借售: p.is_consignment ? "是" : "否",
    购入时间: p.purchased_at ?? "",
    出售时间: p.sold_at ?? "",
    备注: p.notes ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "产品清单");

  const name =
    filename ?? `产品清单_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, name);
}
