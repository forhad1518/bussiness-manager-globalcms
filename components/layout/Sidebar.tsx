"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Banknote,
  ShoppingCart,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cash/in", label: "Cash In", icon: Banknote },
  { href: "/cash/out", label: "Cash Out", icon: Banknote },
  { href: "/savings", label: "Savings", icon: DollarSign },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  open,
  setOpen,
  collapsed,
  setCollapsed,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-white shadow-xl transition-all duration-300 lg:static lg:z-auto flex flex-col",
          collapsed ? "w-16" : "w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header with toggle */}
        <div className="flex items-center justify-between p-4 border-b h-14">
          {!collapsed && (
            <h2 className="text-xl font-bold text-primary truncate">BM</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-gray-100 hidden lg:block"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition",
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-gray-700 hover:bg-gray-100",
                  collapsed && "justify-center px-2",
                )}
              >
                <Icon size={20} />
                {!collapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
