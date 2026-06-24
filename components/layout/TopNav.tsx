"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";

export function TopNav() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
      <div className="md:hidden flex min-w-0 items-center gap-2">
        <MobileNav />
        <span className="text-xl shrink-0">💎</span>
        <span className="truncate text-base font-semibold text-amber-800">
          珠宝管理系统
        </span>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        {email && (
          <span className="hidden text-sm text-gray-600 sm:inline">{email}</span>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">退出</span>
        </Button>
      </div>
    </header>
  );
}
