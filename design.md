# 珠宝黄金销售管理系统
## Jewelry & Gold Sales Management System — 技术设计文档 v1.3

**技术栈：** Next.js 14 (App Router) + Supabase + Vercel  
**数据库：** PostgreSQL (Supabase)  
**部署平台：** Vercel（免费 Hobby 套餐）  
**预计月成本：** ¥0

---

## 目录

1. [项目概述](#一项目概述)
2. [数据库设计](#二数据库设计)
3. [系统架构](#三系统架构)
4. [功能模块设计](#四功能模块设计)
5. [API 接口设计](#五api-接口设计)
6. [前端页面设计](#六前端页面设计)
7. [部署流程](#七部署流程)
8. [安全与权限设计](#八安全与权限设计)
9. [开发建议与扩展方向](#九开发建议与扩展方向)

---

## 一、项目概述

### 1.1 项目背景与目标

珠宝黄金行业具有产品单价高、库存种类多、销售周期不固定的特点，需要一套专业的销售管理工具来：

- 追踪每件产品的完整生命周期（从购入到出售）
- 实时掌握销售状态（已结款、未结款、借售）
- 管理裸石与镶嵌成品的区分，并可标记裸石是否已用于产品
- 产品与裸石均可出售、借调，并追踪认证报告（文档 / 图片）
- 统计利润、汇总财务数据
- 支持产品图片展示，便于识别和管理
- 支持为产品/裸石批量打印二维码标签，并通过扫码快速定位对应记录

### 1.2 技术栈选型

| 层级 | 技术选型 | 选型理由 |
|------|----------|----------|
| 前端框架 | Next.js 14 (App Router) | 内置 SSR/SSG，SEO 友好，免费部署 |
| UI 组件库 | shadcn/ui + Tailwind CSS | 无头组件，样式灵活，无额外费用 |
| 后端 API | Next.js API Routes | Serverless 函数，与前端同仓库，零运维成本 |
| 数据库 | PostgreSQL (Supabase) | 免费 500MB，自带管理界面、认证、实时订阅 |
| 文件存储 | Supabase Storage | 免费 1GB，用于存储产品图片 |
| 认证鉴权 | Supabase Auth | 内置用户管理，支持邮箱登录，免费 |
| 二维码 | qrcode + jspdf + html5-qrcode | 客户端生成标签二维码（qrcode）、导出标签 PDF（jspdf）与拍照/选图识别（html5-qrcode scanFile），纯前端运行，免费 |
| 部署托管 | Vercel | 个人项目免费，自动 CI/CD，与 Next.js 原生集成 |

---

## 二、数据库设计

### 2.1 主表：products（产品主表）

| 字段名（英文） | 字段名（中文） | 数据类型 | 说明 |
|---------------|---------------|----------|------|
| id | 主键 | UUID | 自动生成，唯一标识每件产品 |
| code | 产品编号 | VARCHAR(20) | 入库时自动生成并存储，规则 `P + 北京时间年月日时分秒`（如 `P20260624153012`），便于查询 |
| image_urls | 产品图片 | TEXT[] | 图片 URL 数组，存储在 Supabase Storage |
| name | 产品名称 | VARCHAR(255) | 产品完整名称，如：18K金钻石戒指 |
| total_weight | 重量 | DECIMAL(10,3) | 产品重量，精度至小数点后3位，单位由 weight_unit 决定 |
| weight_unit | 重量单位 | VARCHAR(20) | 可输入单位，默认“克(g)”，可选“克拉(ct)”或自定义 |
| size | 尺寸 | VARCHAR(100) | 尺寸信息，如：戒指12号、手链18cm |
| origin | 产地 | VARCHAR(100) | 产地信息，如：深圳水贝、香港等 |
| inlaid_stones | 镶嵌配石 | TEXT | 配石描述，如：主石1ct D/VVS1，配石0.3ct |
| certificate_urls | 认证报告 | TEXT[] | 认证报告文件 URL 数组，支持图片与文档（PDF/Word），存储在 Supabase Storage |
| gemstone_category | 宝石分类 | VARCHAR(100) | 自由文本，支持输入并按历史值模糊自动补全，可为空 |
| function_category | 功能分类 | VARCHAR(100) | 自由文本，支持输入并按历史值模糊自动补全，可为空 |
| source_loose_stone_id | 来源裸石 | UUID FK | 关联 loose_stones.id，可为空（由裸石加工生产时填写） |
| price | 价格(¥) | DECIMAL(12,2) | 销售报价，人民币，必填 |
| purchase_price | 进货价(¥) | DECIMAL(12,2) | 购入成本，用于计算利润 |
| sale_price | 出售价(¥) | DECIMAL(12,2) | 真实成交出售价格，销售时回写 |
| sale_status | 销售情况 | ENUM | in_stock（在库）/ sold（已售）/ consignment（借售），在【销售管理】中变更 |
| settled_amount | 结款(¥) | DECIMAL(12,2) | 已收款金额 |
| unsettled_amount | 未结款(¥) | DECIMAL(12,2) | **自动计算** = price - settled_amount（仅对已售/借售展示，在库不显示） |
| is_consignment | 借售 | BOOLEAN | 是否为借售/寄售模式 |
| is_loose_stone | 裸石 | BOOLEAN | 是否为裸石（未镶嵌） |
| profit | 利润(¥) | DECIMAL(12,2) | **自动计算** = price - purchase_price |
| purchased_at | 购入时间 | DATE | 产品购入日期 |
| sold_at | 出售时间 | DATE | 产品售出日期，未售出时为 NULL |
| created_at | 创建时间 | TIMESTAMPTZ | 记录创建时间，数据库自动设置 |
| updated_at | 更新时间 | TIMESTAMPTZ | 最后更新时间，自动维护 |
| notes | 备注 | TEXT | 额外备注信息，可选填 |

> **产品编号**：`code` 字段在入库时由数据库触发器自动生成并持久化，规则为 `P + 北京时间年月日时分秒`（如 `P20260624153012`），可直接用于搜索与查询。

### 2.2 辅助表：customers（客户表）

| 字段名 | 中文名 | 类型 | 说明 |
|--------|--------|------|------|
| id | 主键 | UUID | 唯一标识 |
| name | 客户姓名 | VARCHAR(100) | 客户真实姓名或昵称 |
| phone | 联系电话 | VARCHAR(20) | 手机号码 |
| wechat | 微信号 | VARCHAR(100) | 微信联系方式 |
| notes | 备注 | TEXT | 客户偏好、特别说明等 |
| created_at | 创建时间 | TIMESTAMPTZ | 自动设置 |

### 2.3 关联表：product_sales（销售记录表）

| 字段名 | 中文名 | 类型 | 说明 |
|--------|--------|------|------|
| id | 主键 | UUID | 唯一标识 |
| product_id | 产品ID | UUID FK | 关联 products.id，可为空（出售裸石时为空） |
| loose_stone_id | 裸石ID | UUID FK | 关联 loose_stones.id，可为空（出售产品时为空） |
| customer_id | 客户ID | UUID FK | 关联 customers.id，可为空 |
| sale_price | 成交价格 | DECIMAL(12,2) | 实际成交金额 |
| payment_method | 付款方式 | VARCHAR(50) | 现金/微信/支付宝/银行转账 |
| sold_at | 成交时间 | DATE | 实际售出日期 |
| created_at | 记录时间 | TIMESTAMPTZ | 自动设置 |

> 销售记录同时支持**产品**与**裸石**：`product_id` 与 `loose_stone_id` 二者填其一。出售方式支持【出售】与【借售】，提交后自动回写对应物品的销售状态与出售价。

### 2.4 辅助表：loose_stones（裸石表）

裸石为未加工的原石，products 可由裸石加工生产（通过 `products.source_loose_stone_id` 建立关联）。

| 字段名 | 中文名 | 类型 | 说明 |
|--------|--------|------|------|
| id | 主键 | UUID | 唯一标识 |
| code | 裸石编号 | VARCHAR(20) | 入库时自动生成并存储，规则 `L + 北京时间年月日时分秒`（如 `L20260624153012`） |
| image_urls | 裸石图片 | TEXT[] | 图片 URL 数组，存储在 Supabase Storage |
| material | 产品名称 | VARCHAR(100) | 裸石产品名称，如：天然翡翠、矢车菊蓝宝 |
| size | 尺寸 | VARCHAR(100) | 裸石尺寸，如：10×8mm |
| weight | 重量 | DECIMAL(10,3) | 裸石重量，单位由 weight_unit 决定 |
| weight_unit | 重量单位 | VARCHAR(20) | 可输入单位，默认“克(g)”，可选“克拉(ct)”或自定义 |
| price | 价格 | DECIMAL(12,2) | 裸石价格 |
| gemstone_category | 宝石分类 | VARCHAR(100) | 自由文本，支持输入并按历史值模糊自动补全 |
| origin | 产地 | VARCHAR(100) | 裸石产地 |
| certificate | 证书 | VARCHAR(255) | 证书编号或描述 |
| certificate_urls | 认证报告 | TEXT[] | 认证报告文件 URL 数组，支持图片与文档（PDF/Word） |
| sale_status | 销售情况 | ENUM | in_stock（在库）/ sold（已售）/ consignment（借售），在【销售管理】中变更 |
| purchase_price | 进货价(¥) | DECIMAL(12,2) | 购入成本 |
| sale_price | 售出价(¥) | DECIMAL(12,2) | 售出价格，销售时回写 |
| purchased_at | 购入时间 | DATE | 裸石购入日期 |
| sold_at | 卖出时间 | DATE | 裸石卖出日期，未售出时为 NULL |
| notes | 备注 | TEXT | 额外备注，可选填 |
| created_at | 创建时间 | TIMESTAMPTZ | 自动设置 |
| updated_at | 更新时间 | TIMESTAMPTZ | 自动维护 |

> **裸石状态展示**：裸石列表/卡片/表格会根据数据派生状态显示徽标——销售状态（已售/借售）、**已用于产品**（被某件产品通过 `source_loose_stone_id` 引用时）、**借调中**（存在未归还的借调记录时）。

### 2.5 关联表：product_returns（退货记录表）

退货与销售记录关联，登记退货后对应产品自动恢复为【在库】状态。

| 字段名 | 中文名 | 类型 | 说明 |
|--------|--------|------|------|
| id | 主键 | UUID | 唯一标识 |
| sale_id | 销售ID | UUID FK | 关联 product_sales.id，可为空 |
| product_id | 产品ID | UUID FK | 关联 products.id，可为空 |
| customer_id | 客户ID | UUID FK | 关联 customers.id，可为空 |
| refund_amount | 退款金额 | DECIMAL(12,2) | 退还给客户的金额 |
| reason | 退货原因 | TEXT | 退货说明，可选填 |
| returned_at | 退货时间 | DATE | 退货日期 |
| created_at | 记录时间 | TIMESTAMPTZ | 自动设置 |

### 2.6 关联表：item_loans（借调记录表）

产品与裸石均可借调。登记借出后，对应产品/裸石在列表中显示【借调中】状态；登记归还后状态恢复。

| 字段名 | 中文名 | 类型 | 说明 |
|--------|--------|------|------|
| id | 主键 | UUID | 唯一标识 |
| product_id | 产品ID | UUID FK | 关联 products.id，可为空 |
| loose_stone_id | 裸石ID | UUID FK | 关联 loose_stones.id，可为空（与 product_id 二选一） |
| borrower_name | 借出人 | VARCHAR(100) | 必填 |
| borrower_contact | 联系方式 | VARCHAR(100) | 可选填 |
| loaned_at | 借出日期 | DATE | 默认当天 |
| due_at | 预计归还 | DATE | 可选填 |
| returned_at | 归还日期 | DATE | 为空表示借出中，填写后表示已归还 |
| notes | 备注 | TEXT | 可选填 |
| created_at | 记录时间 | TIMESTAMPTZ | 自动设置 |

### 2.7 SQL 建表语句

在 Supabase SQL Editor 中执行：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 销售状态枚举
CREATE TYPE sale_status_enum AS ENUM (
  'in_stock',       -- 在库
  'sold',           -- 已售
  'consignment'     -- 借售
);

-- 宝石分类 / 功能分类已改为自由文本（VARCHAR(100)），不再使用枚举类型

-- 裸石表（products 可由裸石加工生产）
CREATE TABLE loose_stones (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code               VARCHAR(20),    -- 裸石编号，自动生成
  image_urls         TEXT[] DEFAULT '{}',
  material           VARCHAR(100),   -- 产品名称
  size               VARCHAR(100),
  weight             DECIMAL(10,3),
  price              DECIMAL(12,2) DEFAULT 0,
  gemstone_category  VARCHAR(100),
  origin             VARCHAR(100),   -- 产地
  certificate        VARCHAR(255),   -- 证书
  certificate_urls   TEXT[] DEFAULT '{}',      -- 认证报告（图片/文档）
  weight_unit        VARCHAR(20) DEFAULT '克(g)',  -- 重量单位
  sale_status        sale_status_enum DEFAULT 'in_stock',  -- 销售状态
  purchase_price     DECIMAL(12,2) DEFAULT 0,  -- 进货价
  sale_price         DECIMAL(12,2) DEFAULT 0,  -- 售出价
  purchased_at       DATE,           -- 购入时间
  sold_at            DATE,           -- 卖出时间
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 产品主表
CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             VARCHAR(20),    -- 产品编号，自动生成
  image_urls       TEXT[] DEFAULT '{}',
  name             VARCHAR(255) NOT NULL,
  total_weight     DECIMAL(10,3),
  weight_unit      VARCHAR(20) DEFAULT '克(g)',   -- 重量单位
  size             VARCHAR(100),
  origin           VARCHAR(100),
  inlaid_stones    TEXT,
  certificate_urls TEXT[] DEFAULT '{}',          -- 认证报告（图片/文档）
  gemstone_category VARCHAR(100),
  function_category VARCHAR(100),
  source_loose_stone_id UUID REFERENCES loose_stones(id) ON DELETE SET NULL,
  price            DECIMAL(12,2) NOT NULL DEFAULT 0,
  purchase_price   DECIMAL(12,2) DEFAULT 0,
  sale_price       DECIMAL(12,2) DEFAULT 0,       -- 出售价
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

-- 客户表
CREATE TABLE customers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20),
  wechat     VARCHAR(100),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 销售记录表（product_id 与 loose_stone_id 二选一）
CREATE TABLE product_sales (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID REFERENCES products(id) ON DELETE CASCADE,
  loose_stone_id UUID REFERENCES loose_stones(id) ON DELETE CASCADE,
  customer_id    UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_price     DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50),
  sold_at        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 退货记录表（登记退货后产品恢复为在库）
CREATE TABLE product_returns (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id        UUID REFERENCES product_sales(id) ON DELETE SET NULL,
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_id    UUID REFERENCES customers(id) ON DELETE SET NULL,
  refund_amount  DECIMAL(12,2) DEFAULT 0,
  reason         TEXT,
  returned_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 借调记录表（产品与裸石均可借调）
CREATE TABLE item_loans (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id       UUID REFERENCES products(id) ON DELETE CASCADE,
  loose_stone_id   UUID REFERENCES loose_stones(id) ON DELETE CASCADE,
  borrower_name    VARCHAR(100) NOT NULL,
  borrower_contact VARCHAR(100),
  loaned_at        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_at           DATE,
  returned_at      DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 编号自动生成（前缀 + 北京时间年月日时分秒）
CREATE OR REPLACE FUNCTION set_record_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := TG_ARGV[0] || to_char(
      COALESCE(NEW.created_at, NOW()) AT TIME ZONE 'Asia/Shanghai',
      'YYYYMMDDHH24MISS'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_set_code
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION set_record_code('P');

CREATE TRIGGER loose_stones_set_code
  BEFORE INSERT ON loose_stones
  FOR EACH ROW EXECUTE FUNCTION set_record_code('L');

-- 常用索引
CREATE INDEX idx_products_sale_status ON products(sale_status);
CREATE INDEX idx_products_purchased_at ON products(purchased_at);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('simple', name));
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_loose_stones_code ON loose_stones(code);
CREATE INDEX idx_returns_sale ON product_returns(sale_id);
CREATE INDEX idx_returns_product ON product_returns(product_id);
CREATE INDEX idx_returns_returned_at ON product_returns(returned_at);
CREATE INDEX idx_product_sales_loose_stone ON product_sales(loose_stone_id);
CREATE INDEX idx_item_loans_product ON item_loans(product_id);
CREATE INDEX idx_item_loans_loose_stone ON item_loans(loose_stone_id);
CREATE INDEX idx_item_loans_returned ON item_loans(returned_at);
```

---

## 三、系统架构

### 3.1 整体架构

```
【用户浏览器】
      ↕ HTTPS
【Vercel / 边缘网络】
  ├── Next.js 前端页面 (React / SSR / SSG)
  └── Next.js API Routes (Serverless Functions)
      ↕ Supabase SDK / REST API
【Supabase 云服务】
  ├── PostgreSQL 数据库（产品、客户、销售数据）
  ├── Supabase Storage（产品图片文件）
  └── Supabase Auth（用户登录认证）
```

### 3.2 项目目录结构

```
jewelry-system/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx             # 登录页面
│   ├── (dashboard)/
│   │   ├── layout.tsx               # 后台布局（侧边栏+顶部导航）
│   │   ├── page.tsx                 # 仪表盘（数据总览）
│   │   ├── products/
│   │   │   ├── page.tsx             # 产品列表
│   │   │   ├── new/
│   │   │   │   └── page.tsx         # 新增产品
│   │   │   └── [id]/
│   │   │       └── page.tsx         # 产品详情/编辑
│   │   ├── loose-stones/
│   │   │   └── page.tsx             # 裸石管理（含编辑弹窗）
│   │   ├── scan/
│   │   │   └── page.tsx             # 扫码查询（拍照/选图识别跳转）
│   │   ├── sales/
│   │   │   └── page.tsx             # 销售记录
│   │   ├── customers/
│   │   │   └── page.tsx             # 客户管理
│   │   └── reports/
│   │       └── page.tsx             # 财务报表
│   ├── v/                            # 公开展示页（扫码跳转，免登录）
│   │   └── [type]/
│   │       └── [id]/
│   │           └── page.tsx         # 未登录展示（不含价格）/ 已登录跳编辑
│   └── api/                         # API Routes (Serverless)
│       ├── products/
│       │   ├── route.ts             # GET 列表 / POST 新增
│       │   └── [id]/
│       │       └── route.ts         # GET 详情 / PATCH 更新 / DELETE 删除
│       ├── sales/
│       │   └── route.ts             # 销售记录 CRUD
│       ├── customers/
│       │   └── route.ts             # 客户 CRUD
│       └── upload/
│           └── route.ts             # 图片上传至 Supabase Storage
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx              # 侧边栏导航
│   │   └── TopNav.tsx               # 顶部导航栏
│   ├── products/
│   │   ├── ProductCard.tsx          # 产品卡片（图片+信息）
│   │   ├── ProductForm.tsx          # 产品新增/编辑表单
│   │   ├── ProductTable.tsx         # 产品列表表格视图
│   │   └── ProductFilters.tsx       # 筛选条件组件
│   ├── ui/
│   │   ├── ImageUpload.tsx          # 多图上传组件
│   │   ├── StatusBadge.tsx          # 销售状态徽标
│   │   └── StatsCard.tsx            # 统计数据卡片
│   └── reports/
│       └── ProfitChart.tsx          # 利润折线图
├── lib/
│   ├── supabase.ts                  # Supabase 客户端
│   ├── supabase-server.ts           # 服务端 Supabase 客户端
│   ├── labels.ts                    # 标签二维码生成与 PDF 导出
│   └── utils.ts                     # 工具函数（格式化金额等）
├── types/
│   └── index.ts                     # TypeScript 类型定义
├── .env.local                       # 环境变量（不提交 Git）
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 四、功能模块设计

### 4.1 仪表盘（Dashboard）

展示关键业务数据概览：

- **统计卡片**
  - 在库产品数量
  - 本月销售额（按成交价 `sale_price` 汇总，扣除本月退款）
  - 本月利润（成交价 − 进货价，扣除本月退款）
  - 未结款总额（**仅统计已售/借售**，在库产品不计入）
  - 借售中产品数量
- **图表**
  - 近 30 天销售趋势折线图
  - 产品状态分布饼图（在库/已售/借售）
- **待办列表**
  - 未结款超 7 天的订单
  - 借售超 30 天未归还的产品

### 4.2 产品管理模块

#### 产品列表页 `/products`

- 视图切换：卡片视图（含图片预览）/ 表格视图
- 筛选条件：
  - 销售状态（在库/已售/借售）
  - 是否裸石
  - 产地
  - 价格区间（最低价 ~ 最高价）
  - 购入时间范围
- 关键词搜索：按产品名称全文搜索
- 排序：价格、购入时间、创建时间（升序/降序）
- 批量操作：批量导出 Excel（首张图片嵌入第一列）
- **标签 PDF**：一键为当前列表的产品生成标签并保存为 PDF，每个标签含二维码（编码展示页链接）、编号、名称
- **点击编号进入编辑**：表格视图中点击产品编号或名称均可进入对应产品的编辑页

#### 产品新增/编辑页 `/products/new` 和 `/products/[id]`

- 多图上传（拖拽或点击），上传至 Supabase Storage
- **认证报告**上传：支持图片与文档（PDF/Word），图片显示缩略图、文档显示文件卡片，可点击查看
- 所有字段均有对应表单控件（详见第六章）
- **重量 + 可输入单位**：重量数字框旁配单位输入（默认「克(g)」，可选「克拉(ct)」或自定义）
- **出售价**字段：记录真实成交出售价格
- 销售状态不在编辑页操作，统一在【销售管理】中变更
- 利润实时预览：填写进货价和售价后立即显示利润
- 未结款实时计算：售价 - 已结款 = 未结款（红色高亮提示）
- 数字输入框修复：当值为 0 时可正常按 Backspace 删除（NumberInput 组件保留字符串态）
- 删除产品/裸石均需二次确认，防止误删

### 4.3 销售记录模块 `/sales`

- 产品与裸石均可出售：登记销售时选择物品类型（产品/裸石）与出售方式（出售/借售）
- 销售状态统一在【销售管理】中操作，不再在产品/裸石的编辑页变更；提交后自动回写对应物品的销售状态、出售价与出售时间
- 按时间范围查看销售流水，每条记录显示：物品信息、类型（产品/裸石）、客户、成交价、付款方式、成交时间
- 付款状态跟踪：支持记录部分付款
- **退货管理**：在销售页登记退货（关联某笔销售，自动带出产品/客户/退款金额），可编辑、可删除；登记后产品自动恢复为【在库】
- 时间段汇总：总销售额（已扣除退款）、总利润、平均客单价

### 4.4 借调管理模块 `/loans`

- 产品与裸石均可借调：登记借出时选择物品类型与具体物品（自动过滤已出售、已借调中的物品）
- 必填借出人，可填联系方式、借出日期、预计归还日期、备注
- 统计卡片：借调总数 / 借出中 / 已归还
- 列表支持【归还】（标记 returned_at）与【删除】（带二次确认）
- 若某产品/裸石存在未归还记录，会在其列表/卡片/表格中显示【借调中】徽标

### 4.5 客户管理模块 `/customers`

- 客户档案：姓名、电话、微信、备注，支持新增/编辑/删除（删除带二次确认）
- 购买历史：点击客户查看其所有购买记录
- 欠款客户快速筛选

### 4.6 财务报表模块 `/reports`

| 报表名称 | 内容说明 |
|----------|----------|
| 利润统计报表 | 按月/季/年统计利润，对比环比增长 |
| 未结款汇总 | 列出已售/借售中未完全收款记录，支持催款标记 |
| 库存价值报告 | 当前在库产品总价值、成本价值、预计利润空间 |
| 借售产品追踪 | 所有借售产品状态、借出时间 |
| 产品周转分析 | 平均库存周转天数，快销/滞销产品识别 |

---

### 4.7 标签打印与扫码查询模块

为方便实体库存盘点与快速取件，产品与裸石均支持二维码标签打印与扫码定位。

#### 标签打印

- 在【产品管理】与【裸石管理】列表页点击「标签 PDF」按钮，为当前列表中的全部条目生成标签；产品编辑页与裸石编辑弹窗也可为当前单个物品生成标签
- 每个标签包含三部分：
  - **二维码**：编码指向公开展示页 `/v/<p|s>/<id>`（`p` = 产品，`s` = 裸石）
  - **编号**：产品 `P...` / 裸石 `L...`
  - **名称**：产品名称 / 裸石产品名称
- 标签以 48mm × 30mm 排版生成 PDF 并下载保存（不再直接打印），每张标签保留虚线边框作为裁剪分隔参考线
- 二维码生成与 PDF 输出均在客户端完成（`lib/labels.ts` 使用 `qrcode` + `jspdf`），无需后端参与

#### 扫码查询 `/scan`

- 采用「拍照/选图识别」方式：点击大按钮调起手机原生相机拍照或从相册选取二维码图片，再用 `html5-qrcode` 的 `scanFile` 解码（原生相机对焦更好，识别更稳定，已移除实时摄像头扫描）
- 识别成功后进入公开展示页 `/v/<p|s>/<id>`，根据登录状态自动分流：
  - **已登录**：跳转对应编辑页（产品 `/products/[id]`，裸石 `/loose-stones?edit=[id]`）
  - **未登录**（手机相机直扫）：进入清新美观的展示页，**不显示任何价格**，支持多图展示与缩略图切换、点击图片全屏放大，展示名称、编号与规格
- 公开展示页 `/v` 在中间件中放行，无需登录即可访问
- 二维码内容同时兼容旧版 `/scan?t=&id=` 与纯文本 `p:<id>` / `s:<id>`，便于扩展
- 仅需相机/相册权限，无 HTTPS 摄像头限制，识别更通用稳定

---


## 五、API 接口设计

### 5.1 接口总览

| 方法 | 路径 | 功能 | 说明 |
|------|------|------|------|
| GET | /api/products | 获取产品列表 | 支持分页、筛选、搜索 |
| POST | /api/products | 创建产品 | 含图片 URL 数组 |
| GET | /api/products/[id] | 产品详情 | 获取单个产品完整信息 |
| PATCH | /api/products/[id] | 更新产品 | 部分更新 |
| DELETE | /api/products/[id] | 删除产品 | 软删除 |
| POST | /api/upload | 上传文件 | 上传图片/认证报告文档至 Supabase Storage，返回 URL |
| GET | /api/sales | 获取销售记录 | 含产品/裸石关联，支持时间范围筛选 |
| POST | /api/sales | 创建销售记录 | 物品为产品或裸石，同时更新其销售状态与出售价 |
| GET | /api/customers | 客户列表 | |
| POST | /api/customers | 创建客户 | |
| PATCH | /api/customers/[id] | 更新客户 | 部分更新 |
| DELETE | /api/customers/[id] | 删除客户 | 前端二次确认 |
| GET | /api/loose-stones | 裸石列表 | 含 is_used / is_loaned 派生状态，支持筛选、搜索 |
| POST | /api/loose-stones | 创建裸石 | |
| PATCH | /api/loose-stones/[id] | 更新裸石 | 部分更新 |
| DELETE | /api/loose-stones/[id] | 删除裸石 | 前端二次确认 |
| GET | /api/returns | 获取退货记录 | 含产品/客户关联，支持时间、客户筛选 |
| POST | /api/returns | 登记退货 | 同时将产品恢复为【在库】 |
| PATCH | /api/returns/[id] | 更新退货 | 部分更新 |
| DELETE | /api/returns/[id] | 删除退货 | |
| GET | /api/loans | 获取借调记录 | 含产品/裸石关联，支持 active/returned 状态筛选 |
| POST | /api/loans | 登记借出 | 物品为产品或裸石 |
| PATCH | /api/loans/[id] | 更新/归还借调 | 填写 returned_at 即标记归还 |
| DELETE | /api/loans/[id] | 删除借调记录 | |

### 5.2 查询参数（GET /api/products）

| 参数名 | 类型 | 说明 |
|--------|------|------|
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 20，最大 100 |
| status | string | in_stock / sold / consignment |
| is_loose_stone | boolean | 是否裸石筛选 |
| search | string | 产品名称关键词 |
| price_min | number | 最低价格 |
| price_max | number | 最高价格 |
| sort_by | string | price / created_at / purchased_at |
| order | string | asc / desc |

### 5.3 核心代码示例

#### `lib/supabase.ts` — 客户端初始化

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

#### `lib/supabase-server.ts` — 服务端客户端（API Routes 用）

```typescript
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // 服务端使用 service role key
    {
      // 注入 no-store fetch，绕过 Next.js Data Cache，避免读到陈旧数据
      // （修复图片删除后重现、仪表盘数据不同步等问题）
      global: {
        fetch: (input, init) =>
          fetch(input as RequestInfo, { ...init, cache: 'no-store' }),
      },
    }
  )
}
```

#### `types/index.ts` — TypeScript 类型定义

```typescript
export type SaleStatus = 'in_stock' | 'sold' | 'consignment'

export interface Product {
  id: string
  code: string | null
  image_urls: string[]
  name: string
  total_weight: number | null
  weight_unit: string | null        // 重量单位，默认“克(g)”
  size: string | null
  origin: string | null
  inlaid_stones: string | null
  certificate_urls: string[]        // 认证报告（图片/文档）
  gemstone_category: string | null   // 自由文本，按历史值模糊补全
  function_category: string | null   // 自由文本，按历史值模糊补全
  source_loose_stone_id: string | null
  price: number
  purchase_price: number
  sale_price: number                 // 出售价
  sale_status: SaleStatus
  settled_amount: number
  unsettled_amount: number   // 数据库自动计算
  is_consignment: boolean
  is_loose_stone: boolean
  is_loaned?: boolean        // 派生：是否借调中
  profit: number             // 数据库自动计算
  purchased_at: string | null
  sold_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string | null
  wechat: string | null
  notes: string | null
  created_at: string
}

export interface LooseStone {
  id: string
  code: string | null
  image_urls: string[]
  material: string | null        // 产品名称
  size: string | null
  weight: number | null
  weight_unit: string | null         // 重量单位，默认“克(g)”
  price: number
  gemstone_category: string | null   // 自由文本
  origin: string | null              // 产地
  certificate: string | null         // 证书
  certificate_urls: string[]         // 认证报告（图片/文档）
  sale_status: SaleStatus            // 销售状态
  purchase_price: number             // 进货价
  sale_price: number                 // 售出价
  purchased_at: string | null        // 购入时间
  sold_at: string | null             // 卖出时间
  notes: string | null
  is_used?: boolean                  // 派生：是否已用于产品
  is_loaned?: boolean                // 派生：是否借调中
  created_at: string
  updated_at: string
}

export interface ProductSale {
  id: string
  product_id: string | null
  loose_stone_id: string | null
  customer_id: string | null
  sale_price: number
  payment_method: string | null
  sold_at: string
  created_at: string
}

export interface ProductReturn {
  id: string
  sale_id: string | null
  product_id: string | null
  customer_id: string | null
  refund_amount: number
  reason: string | null
  returned_at: string
  created_at: string
}

export interface ItemLoan {
  id: string
  product_id: string | null
  loose_stone_id: string | null
  borrower_name: string
  borrower_contact: string | null
  loaned_at: string
  due_at: string | null
  returned_at: string | null      // 为空表示借出中
  notes: string | null
  created_at: string
}
```

#### `app/api/products/route.ts` — 产品列表 & 新增

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 20)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const is_loose_stone = searchParams.get('is_loose_stone')
  const price_min = searchParams.get('price_min')
  const price_max = searchParams.get('price_max')
  const sort_by = searchParams.get('sort_by') || 'created_at'
  const order = searchParams.get('order') || 'desc'

  const supabase = createServerClient()

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })

  if (status) query = query.eq('sale_status', status)
  if (search) query = query.ilike('name', `%${search}%`)
  if (is_loose_stone !== null) query = query.eq('is_loose_stone', is_loose_stone === 'true')
  if (price_min) query = query.gte('price', Number(price_min))
  if (price_max) query = query.lte('price', Number(price_max))

  query = query
    .order(sort_by, { ascending: order === 'asc' })
    .range((page - 1) * limit, page * limit - 1)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('products')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
```

#### `app/api/products/[id]/route.ts` — 产品详情、更新、删除

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('products')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

#### `app/api/upload/route.ts` — 图片上传

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // 限制：允许图片与文档（PDF/Word），最大 10MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: '只支持图片或 PDF/Word 文档' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: '文件大小不能超过 10MB' }, { status: 400 })
  }

  const supabase = createServerClient()
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filename, file, { contentType: file.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
```

---

## 六、前端页面设计

### 6.1 页面路由总览

| 路由路径 | 页面名称 | 核心功能 |
|----------|----------|----------|
| /login | 登录页 | 邮箱密码登录，Supabase Auth 鉴权 |
| / | 仪表盘 | 数据总览、快捷操作、待办事项 |
| /products | 产品列表 | 多视图浏览、筛选、搜索 |
| /products/new | 新增产品 | 完整产品录入表单 + 图片上传 |
| /products/[id] | 产品详情 | 查看/编辑产品 |
| /loose-stones | 裸石管理 | 裸石多视图浏览、筛选、状态展示（点击编号/名称可编辑） |
| /scan | 扫码查询 | 拍照或选取标签二维码图片，自动跳转对应产品/裸石 |
| /v/[type]/[id] | 扫码展示页 | 公开页：已登录跳转编辑页，未登录显示不含价格的商品展示 |
| /sales | 销售记录 | 销售流水、付款跟踪、退货登记 |
| /loans | 借调管理 | 借出登记、归还、借调状态追踪 |
| /customers | 客户管理 | 客户档案、购买历史 |
| /reports | 财务报表 | 多维度统计图表、导出功能 |

### 6.2 产品表单字段映射

| 表单字段 | 控件类型 | 交互说明 |
|----------|----------|----------|
| 产品图片 | 图片上传组件 | 拖拽/点击上传，多图预览，支持删除、调整顺序、设为首图（首图带「首图」徽章），显示上传进度 |
| 认证报告 | 文件上传组件 | 支持图片与文档（PDF/Word）；图片显示缩略图、文档显示文件卡片，可点击查看 |
| 产品名称 | 文本输入 | 必填，最多 255 字符 |
| 重量 | 数字输入 + 单位输入 | 重量保留 3 位小数；单位默认「克(g)」，可选「克拉(ct)」或自定义 |
| 尺寸 | 文本输入 | 如：戒指12号、手链18cm，可选填 |
| 产地 | 下拉选择 + 自定义输入 | 预设常用产地，支持手动输入 |
| 镶嵌配石 | 多行文本域 | 描述主石、配石详情 |
| 宝石分类 | 下拉选择 | 翡翠 / 蓝宝，可选填 |
| 功能分类 | 下拉选择 | 吊坠 / 项链 / 手镯，可选填 |
| 从现有裸石生产 | 开关 + 下拉选择 | 勾选后可选择一颗已录入的裸石作为加工来源 |
| 价格 | 数字输入 | 人民币，前缀 ¥，必填 |
| 进货价 | 数字输入 | 用于自动计算利润，仅内部可见 |
| 出售价 | 数字输入 | 真实成交出售价格 |
| 结款 | 数字输入 | 已收款额，实时显示未结款余额 |
| 未结款 | 只读计算字段 | 自动 = 价格 - 结款，红色高亮提示 |
| 利润 | 只读计算字段 | 自动 = 价格 - 进货价，绿色显示 |
| 购入时间 | 日期选择器 | 记录购入日期 |
| 备注 | 多行文本域 | 可选填 |

> **销售状态**不在产品/裸石编辑页操作，统一在【销售管理】中变更。所有数字输入框采用 NumberInput 组件，修复了值为 0 时无法按 Backspace 删除的问题。

### 6.3 核心组件示例

#### `components/ui/StatusBadge.tsx`

```tsx
const STATUS_MAP = {
  in_stock:     { label: '在库',  color: 'bg-green-100 text-green-800' },
  sold:         { label: '已售',  color: 'bg-gray-100 text-gray-600' },
  consignment:  { label: '借售',  color: 'bg-yellow-100 text-yellow-800' },
}

export function StatusBadge({ status }: { status: string }) {
  const { label, color } = STATUS_MAP[status as keyof typeof STATUS_MAP]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}
```

#### `components/products/ProductCard.tsx`

```tsx
import Image from 'next/image'
import { Product } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* 产品图片 */}
      <div className="aspect-square relative bg-gray-50">
        {product.image_urls[0] ? (
          <Image src={product.image_urls[0]} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">💎</div>
        )}
      </div>
      {/* 产品信息 */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h3>
          <StatusBadge status={product.sale_status} />
        </div>
        <p className="text-lg font-bold text-amber-700 mt-1">¥{product.price.toLocaleString()}</p>
        <div className="flex gap-3 mt-2 text-xs text-gray-500">
          {product.total_weight && <span>{product.total_weight}g</span>}
          {product.origin && <span>{product.origin}</span>}
          {product.is_loose_stone && <span className="text-blue-600">裸石</span>}
        </div>
        {product.sale_status !== 'in_stock' && product.unsettled_amount > 0 && (
          <p className="text-xs text-red-500 mt-1">未结款：¥{product.unsettled_amount.toLocaleString()}</p>
        )}
      </div>
    </div>
  )
}
```

---

## 七、部署流程

### 步骤一：初始化 Supabase

1. 访问 https://supabase.com 注册账号，创建新项目
2. 进入 **Settings > API**，记录以下三个值：
   - `Project URL`
   - `anon public key`
   - `service_role secret key`
3. 进入 **SQL Editor**，执行第二章中的全部 SQL 建表语句
4. 进入 **Storage**，创建 Bucket：
   - Bucket 名称：`product-images`
   - 访问权限：**Public**
5. 进入 **Authentication > Policies**，确认 RLS 策略已按第八章配置

### 步骤二：初始化 Next.js 项目

```bash
# 创建项目
npx create-next-app@latest jewelry-system \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd jewelry-system

# 安装 Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# 安装 shadcn/ui
npx shadcn-ui@latest init

# 安装常用 shadcn 组件
npx shadcn-ui@latest add button input label select switch badge card table dialog

# 安装图表库（报表页使用）
npm install recharts

# 安装表单验证
npm install zod react-hook-form @hookform/resolvers

# 安装 Excel 导出（exceljs 支持图片嵌入，xlsx 用于报表）
npm install exceljs xlsx

# 安装二维码生成、PDF 导出与扫码识别（标签 PDF / 扫码查询）
npm install qrcode jspdf html5-qrcode
npm install -D @types/qrcode
```

### 步骤三：配置环境变量

创建 `.env.local` 文件（不要提交到 Git）：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 步骤四：部署到 Vercel

```bash
# 推送代码到 GitHub
git init
git add .
git commit -m "init: jewelry management system"
git remote add origin https://github.com/your-name/jewelry-system.git
git push -u origin main
```

1. 访问 https://vercel.com 用 GitHub 账号登录 → **Add New → Project**，导入本仓库
2. 框架预设会自动识别为 **Next.js**，构建命令与输出目录保持默认即可（无需额外配置）
3. 在 **Settings → Environment Variables** 中添加 `.env.local` 中的三个变量（Production / Preview / Development 均可勾选）：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. 点击 **Deploy** 完成首次部署
5. 部署完成后，在 Supabase → Authentication → URL Configuration 将 Vercel 域名加入允许列表
6. 后续每次 `git push` 自动触发重新部署

> Vercel 原生支持 Next.js，API Route 默认运行在 Node.js Serverless 函数上，无需额外适配。图片优化、缓存、环境变量均由 Vercel 自动处理。

> **关于国内访问：** Vercel 默认的 `*.vercel.app` 域名在中国大陆访问不稳定。如需稳定的国内访问，建议绑定自定义域名；Supabase 服务器位于海外，数据库延迟亦会影响访问体验。

### 成本估算

| 服务 | 免费套餐限制 | 月费用 | 超出后价格 |
|------|-------------|--------|-----------|
| Supabase DB | 500MB 存储 | $0 | $25/月（Pro）|
| Supabase Storage | 1GB 图片存储 | $0 | $0.021/GB |
| Supabase Auth | 50,000 MAU | $0 | 含在 Pro 套餐 |
| Cloudflare/Vercel 部署 | Vercel Hobby：100GB 带宽/月 | $0 | Pro $20/月 |
| **合计（小型珠宝店）** | 通常足够 | **¥0/月** | 数据量大时约 $45/月 |

---

## 八、安全与权限设计

### 8.1 Supabase RLS（行级安全策略）

```sql
-- 启用 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

-- 已登录用户可读取所有产品
CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT
  TO authenticated USING (true);

-- 已登录用户可写入产品
CREATE POLICY "Authenticated users can write products"
  ON products FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- 客户表同样配置
CREATE POLICY "Authenticated users can manage customers"
  ON customers FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- 销售记录同样配置
CREATE POLICY "Authenticated users can manage sales"
  ON product_sales FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- 退货记录同样配置
ALTER TABLE product_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage returns"
  ON product_returns FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- 借调记录同样配置
ALTER TABLE item_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage loans"
  ON item_loans FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Storage：已登录用户可上传图片
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'product-images');

-- 任何人可读取图片（因为是 Public Bucket）
CREATE POLICY "Anyone can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
```

### 8.2 API 安全规范

- 所有 API Routes 在服务端使用 `service_role key`，不暴露给前端
- 使用 Supabase Auth 中间件验证用户 Session，未登录返回 401
- 图片/文档上传限制：单文件最大 10MB，允许 jpg/png/webp 图片及 PDF/Word 文档
- 使用 `zod` 对请求体进行 Schema 校验，防止恶意数据写入
- 生产环境强制 HTTPS（Vercel 自动配置）

### 8.3 `middleware.ts` — 路由鉴权

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // 未登录用户重定向到登录页
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 已登录用户访问登录页，重定向到首页
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 九、开发建议与扩展方向

### 9.1 推荐开发顺序

1. **环境搭建** — Supabase 项目 + Next.js 初始化，跑通基础连接
2. **数据库** — 执行建表 SQL，在 Supabase Studio 手动测试增删改查
3. **认证** — 实现登录/登出页面，验证 middleware 鉴权生效
4. **产品 CRUD** — 产品列表、新增、编辑、删除的 API + 页面
5. **图片上传** — 实现多图上传至 Storage，集成到产品表单
6. **仪表盘** — 统计数据查询与卡片展示
7. **财务报表** — 图表与数据导出功能

### 9.2 Prompt 建议（给 AI 编码助手）

做 vibe coding 时，可以把此文档喂给 AI 后，配合以下 Prompt：

```
基于此文档，请帮我实现 [具体功能]。
技术栈：Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui + Supabase。
请严格按照文档中的类型定义、API 路径和数据库字段命名。
```

### 9.3 后续扩展方向

- **移动端适配** — 使用 Tailwind 响应式类，支持手机端浏览管理
- **微信小程序** — 使用 Taro 框架复用业务逻辑，连接相同 Supabase 后端
- **条码/二维码** — 每件产品生成唯一 QR Code，扫码快速查询库存
- **Excel 导出** — 使用 `exceljs` 库导出产品/裸石库存清单（首张图片嵌入第一列），`xlsx` 用于财务报表
- **消息提醒** — 未结款超期通过邮件自动提醒（Supabase Edge Functions）
- **多用户角色** — 区分管理员和销售员权限（通过 Supabase RLS 扩展实现）
- **数据备份** — 定时备份 PostgreSQL 数据到 Google Drive

---

*珠宝黄金销售管理系统 · 技术设计文档 v1.3*
