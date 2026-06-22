import {
  LayoutDashboard,
  Gem,
  Receipt,
  Users,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/products", label: "产品管理", icon: Gem },
  { href: "/sales", label: "销售记录", icon: Receipt },
  { href: "/customers", label: "客户管理", icon: Users },
  { href: "/reports", label: "财务报表", icon: BarChart3 },
];
