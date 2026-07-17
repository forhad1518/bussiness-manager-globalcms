"use client";
import { Menu, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function TopBar({
  setSidebarOpen,
}: {
  setSidebarOpen: (v: boolean) => void;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await axios.post("/api/auth/logout");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-white shadow px-4 py-3 flex items-center justify-between">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
        <Menu size={24} />
      </button>
      <h1 className="text-lg font-semibold text-primary hidden sm:block">
        Business Manager
      </h1>
      <div className="flex items-center gap-4">
        <button className="relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-error text-on-error text-xs rounded-full h-4 w-4 flex items-center justify-center">
            0
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-primary"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
