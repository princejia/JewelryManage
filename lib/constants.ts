import { GemstoneCategory, ProductFunction } from "@/types";

export const GEMSTONE_CATEGORY_LABEL: Record<GemstoneCategory, string> = {
  jade: "翡翠",
  sapphire: "蓝宝",
};

export const GEMSTONE_CATEGORY_OPTIONS: {
  value: GemstoneCategory;
  label: string;
}[] = [
  { value: "jade", label: "翡翠" },
  { value: "sapphire", label: "蓝宝" },
];

export const PRODUCT_FUNCTION_LABEL: Record<ProductFunction, string> = {
  pendant: "吊坠",
  necklace: "项链",
  bracelet: "手镯",
};

export const PRODUCT_FUNCTION_OPTIONS: {
  value: ProductFunction;
  label: string;
}[] = [
  { value: "pendant", label: "吊坠" },
  { value: "necklace", label: "项链" },
  { value: "bracelet", label: "手镯" },
];
