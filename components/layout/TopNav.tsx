"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";

export function TopNav() {
  const router = useRouter();
  const supabase = createClientComponentClient();
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
      <div className="md:hidden flex items-center gap-2">
        <MobileNav />
        <span className="text-xl">💎</span>
        <span className="font-semibold text-amber-800">珠宝管理系统</span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        {email && <span className="text-sm text-gray-600">{email}</span>}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          退出
        </Button>
      </div>
    </header>
  );
}
