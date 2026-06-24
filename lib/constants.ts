import { GemstoneCategory, ProductFunction } from "@/types";

/** 宝石分类默认建议项（自由文本输入，可被历史数据补充） */
export const GEMSTONE_CATEGORY_SUGGESTIONS: string[] = ["翡翠", "蓝宝"];

/** 功能分类默认建议项（自由文本输入，可被历史数据补充） */
export const PRODUCT_FUNCTION_SUGGESTIONS: string[] = ["吊坠", "项链", "手镯"];

// 兼容历史枚举值的展示映射
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  jade: "翡翠",
  sapphire: "蓝宝",
  pendant: "吊坠",
  necklace: "项链",
  bracelet: "手镯",
};

/** 展示分类值：旧枚举值映射为中文，其余直接展示原始文本 */
export function categoryLabel(
  value?: GemstoneCategory | ProductFunction | null
): string {
  if (!value) return "";
  return LEGACY_CATEGORY_LABELS[value] ?? value;
}
