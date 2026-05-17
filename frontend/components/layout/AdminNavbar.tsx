"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  UserCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StoredUser } from "./Navbar";

type AdminNavbarProps = {
  user: StoredUser;
  logout: () => void;
};

function getUserName(user: StoredUser) {
  return user?.name || user?.email || "Admin";
}

function getAvatar(user: StoredUser) {
  return user?.avatar || user?.avatar_url || user?.image || "";
}

function getInitial(name: string) {
  return name?.charAt(0)?.toUpperCase() || "A";
}

export default function AdminNavbar({ user, logout }: AdminNavbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const userName = useMemo(() => getUserName(user), [user]);
  const avatar = useMemo(() => getAvatar(user), [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsAccountDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleToggleTheme() {
    setIsDarkMode((prev) => {
      const next = !prev;

      document.documentElement.setAttribute(
        "data-admin-theme",
        next ? "dark" : "light",
      );

      return next;
    });
  }

  function handleToggleSidebar() {
    setIsSidebarCollapsed((prev) => !prev);
    window.dispatchEvent(new Event("admin-sidebar-toggle"));
  }

  function handleLogout() {
    setIsAccountDropdownOpen(false);
    logout();
  }

  return (
    <header className="admin-topbar border-bottom shadow-sm">
      <div className="d-flex align-items-center justify-content-between px-4 py-3">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary admin-theme-btn d-inline-flex align-items-center justify-content-center"
            onClick={handleToggleSidebar}
            title={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            aria-label={
              isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"
            }
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={22} />
            ) : (
              <ChevronLeft size={22} />
            )}
          </button>

          <div>
            <h5 className="mb-0 fw-bold">Admin Dashboard</h5>
            <span className="small admin-topbar-subtitle">
              Movie Booking Management
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <span className="small admin-topbar-subtitle d-none d-md-inline">
            Quản trị hệ thống
          </span>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary admin-theme-btn d-inline-flex align-items-center justify-content-center"
            onClick={handleToggleTheme}
            title={
              isDarkMode ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"
            }
            aria-label={
              isDarkMode ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"
            }
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="position-relative" ref={dropdownRef}>
            <button
              type="button"
              className="btn border d-flex align-items-center gap-2 px-3 py-2 rounded-3 admin-user-btn"
              onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
              aria-expanded={isAccountDropdownOpen}
              aria-label="Mở menu tài khoản Admin"
            >
              {avatar ? (
                <Image
                  src={avatar}
                  alt={userName}
                  width={34}
                  height={34}
                  className="rounded-circle"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div
                  className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold"
                  style={{ width: 34, height: 34 }}
                >
                  {getInitial(userName)}
                </div>
              )}

              <span className="fw-semibold d-none d-sm-inline">{userName}</span>

              <ChevronDown
                size={16}
                className={`transition ${
                  isAccountDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isAccountDropdownOpen && (
              <div
                className="position-absolute end-0 mt-2 bg-white border rounded-4 shadow-sm overflow-hidden"
                style={{
                  minWidth: 260,
                  zIndex: 1050,
                }}
              >
                <div className="p-3 border-bottom">
                  <div className="d-flex align-items-center gap-3">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={userName}
                        width={44}
                        height={44}
                        className="rounded-circle"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: 44, height: 44 }}
                      >
                        {getInitial(userName)}
                      </div>
                    )}

                    <div style={{ minWidth: 0 }}>
                      <div className="fw-bold text-truncate">{userName}</div>
                      <div className="small text-muted text-truncate">
                        {user?.email || "admin@gmail.com"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="badge rounded-pill bg-danger-subtle text-danger d-inline-flex align-items-center gap-1 px-3 py-2">
                      <ShieldCheck size={14} />
                      Admin
                    </span>
                  </div>
                </div>

                <div className="p-2">
                  <Link
                    href="/admin/profile"
                    className="dropdown-item d-flex align-items-center gap-2 rounded-3 px-3 py-2"
                    onClick={() => setIsAccountDropdownOpen(false)}
                  >
                    <UserCircle size={18} />
                    <span>Thông tin tài khoản</span>
                  </Link>

                  <Link
                    href="/admin/change-password"
                    className="dropdown-item d-flex align-items-center gap-2 rounded-3 px-3 py-2"
                    onClick={() => setIsAccountDropdownOpen(false)}
                  >
                    <KeyRound size={18} />
                    <span>Đổi mật khẩu</span>
                  </Link>

                  {/* <hr className="my-2" />

                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2 rounded-3 px-3 py-2 text-danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button> */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
