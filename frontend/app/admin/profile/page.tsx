"use client";

import { Mail, MapPin, Phone, Save, ShieldCheck, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";
import type { User as UserType } from "@/types/user";

function getInitial(name: string) {
  return name?.charAt(0)?.toUpperCase() || "A";
}

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, token, loading, setUser } = useAuth();

  const currentUser = useMemo(() => user, [user]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!token || !user)) {
      router.replace("/login");
    }
  }, [loading, token, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!currentUser) return;

    if (!name.trim()) {
      setError("Vui lòng nhập họ tên Admin");
      return;
    }

    if (phone.trim() && !/^(0|\+84)[0-9]{9,10}$/.test(phone.trim())) {
      setError("Số điện thoại không hợp lệ");
      return;
    }

    try {
      setSubmitting(true);

      const data = await authService.updateMe({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });

      if (data?.user) {
        setUser(data.user as UserType);
      }

      setSuccess("Cập nhật thông tin Admin thành công!");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Cập nhật thông tin Admin thất bại",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="alert alert-info">Đang tải...</div>
      </div>
    );
  }

  if (!token || !currentUser) {
    return (
      <div className="admin-page">
        <div className="alert alert-warning">
          Đang chuyển đến trang đăng nhập...
        </div>
      </div>
    );
  }

  const displayName = name.trim() || currentUser.email || "Admin";

  return (
    <div className="admin-page">
      <div
        className="rounded-4 p-4 p-md-5 mb-4 text-white"
        style={{
          background:
            "linear-gradient(135deg, #dc3545 0%, #e11d48 50%, #7f1d1d 100%)",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle bg-white text-danger d-flex align-items-center justify-content-center"
            style={{ width: 58, height: 58 }}
          >
            <ShieldCheck size={30} />
          </div>

          <div>
            <p className="text-uppercase small fw-bold mb-2 opacity-75">
              CineGo Admin
            </p>
            <h2 className="fw-bold mb-2">Thông tin tài khoản Admin</h2>
            <p className="mb-0 opacity-75">
              Quản lý thông tin cá nhân của tài khoản quản trị hệ thống.
            </p>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body text-center p-4">
              <div className="d-flex justify-content-center mb-3">
                <div
                  className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                  style={{ width: 128, height: 128, fontSize: 44 }}
                >
                  {getInitial(displayName)}
                </div>
              </div>

              <h5 className="fw-bold mb-1">{displayName}</h5>
              <p className="text-muted small mb-3">{currentUser.email}</p>

              <span className="badge rounded-pill bg-danger-subtle text-danger px-3 py-2">
                Admin
              </span>

              <hr className="my-4" />

              <div className="text-start">
                <div className="d-flex align-items-center gap-2 mb-2 text-muted small">
                  <Mail size={16} />
                  <span className="text-truncate">{currentUser.email}</span>
                </div>

                <div className="d-flex align-items-center gap-2 mb-2 text-muted small">
                  <Phone size={16} />
                  <span>{phone || "Chưa cập nhật số điện thoại"}</span>
                </div>

                <div className="d-flex align-items-center gap-2 text-muted small">
                  <MapPin size={16} />
                  <span>{address || "Chưa cập nhật địa chỉ"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-bottom py-3 rounded-top-4">
              <h5 className="mb-0 fw-bold">Chi tiết tài khoản Admin</h5>
            </div>

            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <User size={16} className="me-1" />
                    Họ tên Admin
                  </label>
                  <input
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ tên Admin"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <Mail size={16} className="me-1" />
                    Email
                  </label>
                  <input
                    className="form-control"
                    value={currentUser.email || ""}
                    readOnly
                  />
                  <div className="form-text">
                    Email Admin không thể thay đổi.
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <Phone size={16} className="me-1" />
                    Số điện thoại
                  </label>
                  <input
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <MapPin size={16} className="me-1" />
                    Địa chỉ
                  </label>
                  <input
                    className="form-control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => router.push("/admin")}
                >
                  Quay lại Dashboard
                </button>

                <button
                  type="submit"
                  className="btn btn-danger d-flex align-items-center gap-2 px-4"
                  disabled={submitting}
                >
                  <Save size={18} />
                  {submitting ? "Đang cập nhật..." : "Cập nhật tài khoản"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
