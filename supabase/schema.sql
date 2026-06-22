-- ============================================================
-- 珠宝黄金销售管理系统 — 数据库建表脚本
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 销售状态枚举
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status_enum') THEN
    CREATE TYPE sale_status_enum AS ENUM (
      'in_stock',       -- 在库
      'sold',           -- 已售
      'consignment'     -- 借售
    );
  END IF;
END$$;

-- ------------------------------------------------------------
-- 产品主表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_urls       TEXT[] DEFAULT '{}',
  name             VARCHAR(255) NOT NULL,
  total_weight     DECIMAL(10,3),
  origin           VARCHAR(100),
  inlaid_stones    TEXT,
  price            DECIMAL(12,2) NOT NULL DEFAULT 0,
  purchase_price   DECIMAL(12,2) DEFAULT 0,
  sale_status      sale_status_enum DEFAULT 'in_stock',
  settled_amount   DECIMAL(12,2) DEFAULT 0,
  -- 未结款：自动计算字段
  unsettled_amount DECIMAL(12,2) GENERATED ALWAYS AS (price - settled_amount) STORED,
  is_consignment   BOOLEAN DEFAULT FALSE,
  is_loose_stone   BOOLEAN DEFAULT FALSE,
  -- 利润：自动计算字段
  profit           DECIMAL(12,2) GENERATED ALWAYS AS (price - purchase_price) STORED,
  purchased_at     DATE,
  sold_at          DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 客户表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20),
  wechat     VARCHAR(100),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 销售记录表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_sales (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id    UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_price     DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50),
  sold_at        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 自动更新 updated_at 触发器
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- 常用索引
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_sale_status ON products(sale_status);
CREATE INDEX IF NOT EXISTS idx_products_purchased_at ON products(purchased_at);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('simple', name));

-- ============================================================
-- 行级安全策略 (RLS)
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read products" ON products;
CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can write products" ON products;
CREATE POLICY "Authenticated users can write products"
  ON products FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
CREATE POLICY "Authenticated users can manage customers"
  ON customers FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage sales" ON product_sales;
CREATE POLICY "Authenticated users can manage sales"
  ON product_sales FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Storage 策略（请先在 Storage 创建名为 product-images 的 Public Bucket）
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can read product images" ON storage.objects;
CREATE POLICY "Anyone can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
