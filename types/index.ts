export type SaleStatus = "in_stock" | "sold" | "consignment";

export type GemstoneCategory = "jade" | "sapphire";

export type ProductFunction = "pendant" | "necklace" | "bracelet";

export interface Product {
  id: string;
  image_urls: string[];
  name: string;
  total_weight: number | null;
  size: string | null;
  origin: string | null;
  inlaid_stones: string | null;
  gemstone_category: GemstoneCategory | null;
  function_category: ProductFunction | null;
  source_loose_stone_id: string | null;
  price: number;
  purchase_price: number;
  sale_status: SaleStatus;
  settled_amount: number;
  unsettled_amount: number; // 数据库自动计算
  is_consignment: boolean;
  is_loose_stone: boolean;
  profit: number; // 数据库自动计算
  purchased_at: string | null;
  sold_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  wechat: string | null;
  notes: string | null;
  created_at: string;
}

export interface LooseStone {
  id: string;
  size: string | null;
  material: string | null;
  weight: number | null;
  price: number;
  gemstone_category: GemstoneCategory | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type LooseStoneInput = {
  size: string | null;
  material: string | null;
  weight: number | null;
  price: number;
  gemstone_category: GemstoneCategory | null;
  notes: string | null;
};

export interface ProductSale {
  id: string;
  product_id: string;
  customer_id: string | null;
  sale_price: number;
  payment_method: string | null;
  sold_at: string;
  created_at: string;
}

export interface ProductSaleWithRelations extends ProductSale {
  products?: Pick<Product, "id" | "name" | "image_urls"> | null;
  customers?: Pick<Customer, "id" | "name"> | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** 产品表单输入类型（不含自动计算字段与时间戳） */
export type ProductInput = {
  image_urls: string[];
  name: string;
  total_weight: number | null;
  size: string | null;
  origin: string | null;
  inlaid_stones: string | null;
  gemstone_category: GemstoneCategory | null;
  function_category: ProductFunction | null;
  source_loose_stone_id: string | null;
  price: number;
  purchase_price: number;
  sale_status: SaleStatus;
  settled_amount: number;
  is_consignment: boolean;
  is_loose_stone: boolean;
  purchased_at: string | null;
  sold_at: string | null;
  notes: string | null;
};
