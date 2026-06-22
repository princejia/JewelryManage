# 珠宝黄金销售管理系统
## Jewelry & Gold Sales Management System — 技术设计文档 v1.0

**技术栈：** Next.js 14 + Supabase + Vercel  
**数据库：** PostgreSQL (Supabase)  
**部署平台：** Vercel（免费套餐）  
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
- 管理裸石与镶嵌成品的区分
- 统计利润、汇总财务数据
- 支持产品图片展示，便于识别和管理

### 1.2 技术栈选型

| 层级 | 技术选型 | 选型理由 |
|------|----------|----------|
| 前端框架 | Next.js 14 (App Router) | 内置 SSR/SSG，SEO 友好，Vercel 原生支持，免费部署 |
| UI 组件库 | shadcn/ui + Tailwind CSS | 无头组件，样式灵活，无额外费用 |
| 后端 API | Next.js API Routes | Serverless 函数，与前端同仓库，零运维成本 |
| 数据库 | PostgreSQL (Supabase) | 免费 500MB，自带管理界面、认证、实时订阅 |
| 文件存储 | Supabase Storage | 免费 1GB，用于存储产品图片 |
| 认证鉴权 | Supabase Auth | 内置用户管理，支持邮箱登录，免费 |
| 部署托管 | Vercel | 个人项目免费，自动 CI/CD，全球 CDN |

---

## 二、数据库设计

### 2.1 主表：products（产品主表）

| 字段名（英文） | 字段名（中文） | 数据类型 | 说明 |
|---------------|---------------|----------|------|
| id | 主键 | UUID | 自动生成，唯一标识每件产品 |
| image_urls | 产品图片 | TEXT[] | 图片 URL 数组，存储在 Supabase Storage |
| name | 产品名称 | VARCHAR(255) | 产品完整名称，如：18K金钻石戒指 |
| total_weight | 总重量(g) | DECIMAL(10,3) | 产品总重量，单位克，精度至小数点后3位 |
| origin | 产地 | VARCHAR(100) | 产地信息，如：深圳水贝、香港等 |
| inlaid_stones | 镶嵌配石 | TEXT | 配石描述，如：主石1ct D/VVS1，配石0.3ct |
| price | 价格(¥) | DECIMAL(12,2) | 销售价格，人民币，必填 |
| purchase_price | 进货价(¥) | DECIMAL(12,2) | 购入成本，用于计算利润 |
| sale_status | 销售情况 | ENUM | in_stock（在库）/ sold（已售）/ consignment（借售）|
| settled_amount | 结款(¥) | DECIMAL(12,2) | 已收款金额 |
| unsettled_amount | 未结款(¥) | DECIMAL(12,2) | **自动计算** = price - settled_amount |
| is_consignment | 借售 | BOOLEAN | 是否为借售/寄售模式 |
| is_loose_stone | 裸石 | BOOLEAN | 是否为裸石（未镶嵌） |
| profit | 利润(¥) | DECIMAL(12,2) | **自动计算** = price - purchase_price |
| purchased_at | 购入时间 | DATE | 产品购入日期 |
| sold_at | 出售时间 | DATE | 产品售出日期，未售出时为 NULL |
| created_at | 创建时间 | TIMESTAMPTZ | 记录创建时间，数据库自动设置 |
| updated_at | 更新时间 | TIMESTAMPTZ | 最后更新时间，自动维护 |
| notes | 备注 | TEXT | 额外备注信息，可选填 |

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
| product_id | 产品ID | UUID FK | 关联 products.id |
| customer_id | 客户ID | UUID FK | 关联 customers.id，可为空 |
| sale_price | 成交价格 | DECIMAL(12,2) | 实际成交金额 |
| payment_method | 付款方式 | VARCHAR(50) | 现金/微信/支付宝/银行转账 |
| sold_at | 成交时间 | DATE | 实际售出日期 |
| created_at | 记录时间 | TIMESTAMPTZ | 自动设置 |

### 2.4 SQL 建表语句

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

-- 产品主表
CREATE TABLE products (
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

-- 客户表
CREATE TABLE customers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20),
  wechat     VARCHAR(100),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 销售记录表
CREATE TABLE product_sales (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id    UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_price     DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50),
  sold_at        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 自动更新 updated_at 触发器
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

-- 常用索引
CREATE INDEX idx_products_sale_status ON products(sale_status);
CREATE INDEX idx_products_purchased_at ON products(purchased_at);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('simple', name));
```

---

## 三、系统架构

### 3.1 整体架构

```
【用户浏览器】
      ↕ HTTPS
【Vercel CDN / Edge Network】
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
│   │   ├── sales/
│   │   │   └── page.tsx             # 销售记录
│   │   ├── customers/
│   │   │   └── page.tsx             # 客户管理
│   │   └── reports/
│   │       └── page.tsx             # 财务报表
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
  - 本月销售额
  - 本月利润
  - 未结款总额
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
- 批量操作：批量导出 Excel

#### 产品新增/编辑页 `/products/new` 和 `/products/[id]`

- 多图上传（拖拽或点击），上传至 Supabase Storage
- 所有字段均有对应表单控件（详见第六章）
- 销售状态流转：在库 → 已售/借售，状态变更时自动填入出售时间
- 利润实时预览：填写进货价和售价后立即显示利润
- 未结款实时计算：售价 - 已结款 = 未结款（红色高亮提示）

### 4.3 销售记录模块 `/sales`

- 按时间范围查看销售流水
- 每条记录显示：产品信息、客户、成交价、付款方式、成交时间
- 付款状态跟踪：支持记录部分付款
- 时间段汇总：总销售额、总利润、平均客单价

### 4.4 客户管理模块 `/customers`

- 客户档案：姓名、电话、微信、备注
- 购买历史：点击客户查看其所有购买记录
- 欠款客户快速筛选

### 4.5 财务报表模块 `/reports`

| 报表名称 | 内容说明 |
|----------|----------|
| 利润统计报表 | 按月/季/年统计利润，对比环比增长 |
| 未结款汇总 | 列出所有未完全收款记录，支持催款标记 |
| 库存价值报告 | 当前在库产品总价值、成本价值、预计利润空间 |
| 借售产品追踪 | 所有借售产品状态、借出时间 |
| 产品周转分析 | 平均库存周转天数，快销/滞销产品识别 |

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
| POST | /api/upload | 上传图片 | 上传至 Supabase Storage，返回 URL |
| GET | /api/sales | 获取销售记录 | 支持时间范围筛选 |
| POST | /api/sales | 创建销售记录 | 同时更新产品状态 |
| GET | /api/customers | 客户列表 | |
| POST | /api/customers | 创建客户 | |

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
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // 服务端使用 service role key
  )
}
```

#### `types/index.ts` — TypeScript 类型定义

```typescript
export type SaleStatus = 'in_stock' | 'sold' | 'consignment'

export interface Product {
  id: string
  image_urls: string[]
  name: string
  total_weight: number | null
  origin: string | null
  inlaid_stones: string | null
  price: number
  purchase_price: number
  sale_status: SaleStatus
  settled_amount: number
  unsettled_amount: number   // 数据库自动计算
  is_consignment: boolean
  is_loose_stone: boolean
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

export interface ProductSale {
  id: string
  product_id: string
  customer_id: string | null
  sale_price: number
  payment_method: string | null
  sold_at: string
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

  // 限制：只允许图片，最大 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: '只支持 JPG/PNG/WEBP 格式' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: '文件大小不能超过 5MB' }, { status: 400 })
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
| /products/[id] | 产品详情 | 查看/编辑产品，变更销售状态 |
| /sales | 销售记录 | 销售流水、付款跟踪 |
| /customers | 客户管理 | 客户档案、购买历史 |
| /reports | 财务报表 | 多维度统计图表、导出功能 |

### 6.2 产品表单字段映射

| 表单字段 | 控件类型 | 交互说明 |
|----------|----------|----------|
| 产品图片 | 图片上传组件 | 拖拽/点击上传，多图预览，支持删除，显示上传进度 |
| 产品名称 | 文本输入 | 必填，最多 255 字符 |
| 总重量 | 数字输入 | 单位：克，保留 3 位小数 |
| 产地 | 下拉选择 + 自定义输入 | 预设常用产地，支持手动输入 |
| 镶嵌配石 | 多行文本域 | 描述主石、配石详情 |
| 价格 | 数字输入 | 人民币，前缀 ¥，必填 |
| 进货价 | 数字输入 | 用于自动计算利润，仅内部可见 |
| 销售情况 | 单选按钮组 | 在库 / 已售 / 借售；选已售时显示出售时间 |
| 结款 | 数字输入 | 已收款额，实时显示未结款余额 |
| 未结款 | 只读计算字段 | 自动 = 价格 - 结款，红色高亮提示 |
| 借售 | 开关（Toggle） | 开启后自动同步销售情况为【借售】 |
| 裸石 | 开关（Toggle） | 标记是否为未镶嵌裸石 |
| 利润 | 只读计算字段 | 自动 = 价格 - 进货价，绿色显示 |
| 购入时间 | 日期选择器 | 记录购入日期 |
| 出售时间 | 日期选择器 | 销售状态为【已售/借售】时显示 |
| 备注 | 多行文本域 | 可选填 |

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
        {product.unsettled_amount > 0 && (
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

1. 访问 https://vercel.com，用 GitHub 账号登录
2. 点击 **New Project**，导入 GitHub 仓库
3. 在 **Environment Variables** 中添加 `.env.local` 中的三个变量
4. 点击 **Deploy**，约 2 分钟完成部署
5. 后续每次 `git push` 自动触发重新部署

### 成本估算

| 服务 | 免费套餐限制 | 月费用 | 超出后价格 |
|------|-------------|--------|-----------|
| Supabase DB | 500MB 存储 | $0 | $25/月（Pro）|
| Supabase Storage | 1GB 图片存储 | $0 | $0.021/GB |
| Supabase Auth | 50,000 MAU | $0 | 含在 Pro 套餐 |
| Vercel 部署 | 100GB 带宽 | $0 | $20/月（Pro）|
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
- 图片上传限制：单文件最大 5MB，只允许 jpg/png/webp 格式
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
- **Excel 导出** — 使用 `xlsx` 库导出库存清单和财务报表
- **消息提醒** — 未结款超期通过邮件自动提醒（Supabase Edge Functions）
- **多用户角色** — 区分管理员和销售员权限（通过 Supabase RLS 扩展实现）
- **数据备份** — 定时备份 PostgreSQL 数据到 Google Drive

---

*珠宝黄金销售管理系统 · 技术设计文档 v1.0*
