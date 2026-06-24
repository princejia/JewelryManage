import { z } from "zod";

export const saleStatusEnum = z.enum(["in_stock", "sold", "consignment"]);

export const productSchema = z.object({
  image_urls: z.array(z.string().url()).default([]),
  name: z.string().min(1, "产品名称必填").max(255),
  total_weight: z.coerce.number().nonnegative().nullable().optional(),
  size: z.string().max(100).nullable().optional(),
  origin: z.string().max(100).nullable().optional(),
  inlaid_stones: z.string().nullable().optional(),
  gemstone_category: z.string().max(100).nullable().optional(),
  function_category: z.string().max(100).nullable().optional(),
  source_loose_stone_id: z.string().uuid().nullable().optional(),
  price: z.coerce.number().nonnegative("价格必须为非负数"),
  purchase_price: z.coerce.number().nonnegative().default(0),
  sale_status: saleStatusEnum.default("in_stock"),
  settled_amount: z.coerce.number().nonnegative().default(0),
  is_consignment: z.boolean().default(false),
  is_loose_stone: z.boolean().default(false),
  purchased_at: z.string().nullable().optional(),
  sold_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ProductSchema = z.infer<typeof productSchema>;

export const looseStoneSchema = z.object({
  image_urls: z.array(z.string().url()).default([]),
  size: z.string().max(100).nullable().optional(),
  material: z.string().max(100).nullable().optional(),
  weight: z.coerce.number().nonnegative().nullable().optional(),
  price: z.coerce.number().nonnegative().default(0),
  gemstone_category: z.string().max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type LooseStoneSchema = z.infer<typeof looseStoneSchema>;

export const customerSchema = z.object({
  name: z.string().min(1, "客户姓名必填").max(100),
  phone: z.string().max(20).nullable().optional(),
  wechat: z.string().max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CustomerSchema = z.infer<typeof customerSchema>;

export const saleSchema = z.object({
  product_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable().optional(),
  sale_price: z.coerce.number().nonnegative(),
  payment_method: z.string().max(50).nullable().optional(),
  sold_at: z.string().optional(),
});

export type SaleSchema = z.infer<typeof saleSchema>;
