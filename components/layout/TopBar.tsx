"use client";
import { useState, useEffect, useCallback } from "react";
import { Menu, Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function TopBar({
  setSidebarOpen,
}: {
  setSidebarOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get("/api/notifications?unread=1&limit=10");
      setUnreadCount(res.data.unreadCount);
      setNotifications(res.data.notifications);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      await fetchNotifications();
    }
  };

  const handleMarkRead = async (
    id: string,
    type?: string,
    message?: string,
  ) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Navigate based on type
      if (type?.startsWith("order")) {
        const match = message?.match(/ORD-\d+/);
        if (match) router.push(`/orders?search=${match[0]}`);
        else router.push("/orders");
      } else if (type?.startsWith("client")) {
        router.push("/clients");
      }
      setShowDropdown(false);
    } catch {}
  };

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
        <div className="relative">
          <button
            onClick={handleBellClick}
            className="relative p-1 rounded-full hover:bg-gray-100"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b">
                <p className="font-semibold">Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <p className="p-4 text-gray-500">No new notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleMarkRead(n._id, n.type, n.message)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-xs text-gray-600">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
