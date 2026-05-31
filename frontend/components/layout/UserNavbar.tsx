"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LockKeyhole,
  LogOut,
  Settings,
  Ticket,
  UserCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StoredUser } from "./Navbar";
import NotificationBell from "@/components/notifications/NotificationBell";

type UserNavbarProps = {
  user: StoredUser | null;
  token: string | null;
  logout: () => void;
};

function getUserName(user: StoredUser | null) {
  return user?.name || user?.email || "User";
}

function getAvatar(user: StoredUser | null) {
  return user?.avatar || user?.avatar_url || user?.image || "";
}

function getInitial(name: string) {
  return name?.charAt(0)?.toUpperCase() || "U";
}

export default function UserNavbar({ user, token, logout }: UserNavbarProps) {
  const router = useRouter();

  const memberMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [openMemberMenu, setOpenMemberMenu] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);

  const userName = useMemo(() => getUserName(user), [user]);
  const avatar = useMemo(() => getAvatar(user), [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (memberMenuRef.current && !memberMenuRef.current.contains(target)) {
        setOpenMemberMenu(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setOpenUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleMyTickets() {
    if (!token) {
      router.push("/login");
      return;
    }

    router.push("/profile/bookings");
  }

  function handleLogout() {
    logout();
    setOpenUserMenu(false);
    setOpenMemberMenu(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="user-navbar border-bottom">
      <div className="container d-flex align-items-center justify-content-between py-3">
        <div className="d-flex align-items-center gap-4">
          <Link
            href="/"
            className="fw-bold text-danger fs-4 text-decoration-none"
          >
            CineGo
          </Link>

          <div ref={memberMenuRef} className="dropdown position-relative">
            <button
              type="button"
              className="btn btn-link text-decoration-none fw-semibold dropdown-toggle"
              onClick={() => {
                setOpenMemberMenu((prev) => !prev);
                setOpenUserMenu(false);
              }}
            >
              Thành viên
            </button>

            {openMemberMenu && (
              <ul
                className="dropdown-menu show shadow border-0 user-dropdown-menu"
                style={{
                  display: "block",
                  minWidth: 190,
                  marginTop: 10,
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <li>
                  <Link
                    href="/members/account"
                    className="dropdown-item d-flex align-items-center gap-2 py-2"
                    onClick={() => setOpenMemberMenu(false)}
                  >
                    <UserCircle size={18} />
                    Tài khoản
                  </Link>
                </li>

                <li>
                  <Link
                    href="/members/benefits"
                    className="dropdown-item d-flex align-items-center gap-2 py-2"
                    onClick={() => setOpenMemberMenu(false)}
                  >
                    <Ticket size={18} />
                    Quyền lợi
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>

        <nav className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={handleMyTickets}
            className="btn btn-link text-decoration-none"
          >
            Vé của tôi
          </button>

          {!token || !user ? (
            <Link href="/login" className="btn btn-outline-secondary">
              Đăng nhập / Đăng ký
            </Link>
          ) : (
            <>
              <NotificationBell token={token} />

              <div ref={userMenuRef} className="dropdown position-relative">
                <button
                  type="button"
                  className="btn border d-flex align-items-center gap-2 user-menu-button"
                  onClick={() => {
                    setOpenUserMenu((prev) => !prev);
                    setOpenMemberMenu(false);
                  }}
                  aria-expanded={openUserMenu}
                >
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={userName}
                      width={40}
                      height={40}
                      className="rounded-circle"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold"
                      style={{ width: 40, height: 40 }}
                    >
                      {getInitial(userName)}
                    </div>
                  )}

                  <span className="fw-semibold">{userName}</span>
                </button>

                {openUserMenu && (
                  <ul
                    className="dropdown-menu dropdown-menu-end show shadow border-0 user-dropdown-menu"
                    style={{
                      display: "block",
                      right: 0,
                      minWidth: 250,
                      marginTop: 10,
                      borderRadius: 16,
                      overflow: "hidden",
                      padding: "8px 0",
                    }}
                  >
                    <li className="px-3 py-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-bold text-truncate">
                            {userName}
                          </div>

                          {user.email && (
                            <div className="small text-muted text-truncate">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>

                    <li>
                      <Link
                        href="/profile/account"
                        className="dropdown-item d-flex align-items-center gap-3 py-2 px-3"
                        onClick={() => setOpenUserMenu(false)}
                      >
                        <UserCircle size={18} />
                        <span>Tài khoản</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/profile/settings"
                        className="dropdown-item d-flex align-items-center gap-3 py-2 px-3"
                        onClick={() => setOpenUserMenu(false)}
                      >
                        <Settings size={18} />
                        <span>Cài đặt</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/profile/change-password"
                        className="dropdown-item d-flex align-items-center gap-3 py-2 px-3"
                        onClick={() => setOpenUserMenu(false)}
                      >
                        <LockKeyhole size={18} />
                        <span>Thay đổi mật khẩu</span>
                      </Link>
                    </li>

                    <li>
                      <hr className="dropdown-divider my-2" />
                    </li>

                    <li>
                      <button
                        type="button"
                        className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 text-danger fw-semibold"
                        onClick={handleLogout}
                      >
                        <LogOut size={18} />
                        <span>Đăng xuất</span>
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
