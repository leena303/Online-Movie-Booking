"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import UserNavbar from "./UserNavbar";
import AdminNavbar from "./AdminNavbar";
import NotificationBell from "@/components/notifications/NotificationBell";

export type StoredUser = {
  id?: number | string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
  image?: string | null;
  avatar_url?: string | null;
};

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function NavbarSkeleton() {
  return (
    <header className="border-bottom bg-light">
      <div className="container py-3" style={{ height: 70 }} />
    </header>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const isClient = useIsClient();
  const { user, token, loading, logout } = useAuth();

  if (!isClient || loading) {
    return <NavbarSkeleton />;
  }

  const isAdminPage = pathname.startsWith("/admin");

  if (isAdminPage && token && user) {
    return <AdminNavbar user={user} logout={logout} />;
  }

  if (isAdminPage) {
    return null;
  }

  return <UserNavbar user={user} token={token} logout={logout} />;
}
