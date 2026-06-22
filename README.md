# 珠宝黄金销售管理系统

Jewelry & Gold Sales Management System — 基于 **Next.js 14 + Supabase + Vercel** 的销售管理工具。

## 功能

- 📊 仪表盘：在库数量、本月销售额/利润、未结款、借售待办
- 💎 产品管理：卡片/表格视图、筛选搜索、多图上传、利润与未结款实时计算
- 🧾 销售记录：销售流水、客单价统计
- 👥 客户管理：客户档案
- 📈 财务报表：销售趋势图、库存价值、未结款汇总、借售追踪
- 🔐 Supabase Auth 登录鉴权 + 路由 middleware 保护

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 在 [supabase.com](https://supabase.com) 创建项目。
2. 在 **SQL Editor** 执行 [`supabase/schema.sql`](supabase/schema.sql) 中的全部语句。
3. 在 **Storage** 创建名为 `product-images` 的 **Public** Bucket。
4. 在 **Authentication > Users** 手动创建一个登录用户（邮箱 + 密码）。

### 3. 配置环境变量

复制 `.env.local.example` 为 `.env.local` 并填入：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 启动

```bash
npm run dev
```

访问 http://localhost:3000

## 部署到 Vercel

1. 推送代码到 GitHub。
2. 在 Vercel 导入仓库，添加上述 3 个环境变量。
3. Deploy。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| UI | Tailwind CSS + shadcn/ui 风格组件 |
| 数据库 | Supabase (PostgreSQL) |
| 存储 | Supabase Storage |
| 认证 | Supabase Auth |
| 图表 | Recharts |
| 校验 | Zod |

## 目录结构

```
app/
  (auth)/login          登录页
  (dashboard)/          后台（仪表盘/产品/销售/客户/报表）
  api/                  API Routes
components/             UI 与业务组件
lib/                    Supabase 客户端、工具函数、校验
types/                  TypeScript 类型
supabase/schema.sql     数据库建表脚本
```
