"use client";

import { Eye, EyeOff, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";

function validatePassword(password: string) {
  if (!password.trim()) {
    return "Vui lòng nhập mật khẩu mới";
  }

  if (password.length < 8) {
    return "Mật khẩu mới phải có ít nhất 8 ký tự";
  }

  if (!/[A-Z]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất 1 chữ hoa";
  }

  if (!/[a-z]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất 1 chữ thường";
  }

  if (!/[0-9]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất 1 số";
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt";
  }

  return "";
}

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const { token, loading } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, token, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!oldPassword.trim()) {
      setError("Vui lòng nhập mật khẩu cũ");
      return;
    }

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (oldPassword === newPassword) {
      setError("Mật khẩu mới không được trùng mật khẩu cũ");
      return;
    }

    try {
      setSubmitting(true);

      await authService.updateMe({
        oldPassword,
        newPassword,
      });

      setSuccess("Đổi mật khẩu Admin thành công!");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Đổi mật khẩu Admin thất bại",
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

  if (!token) {
    return (
      <div className="admin-page">
        <div className="alert alert-warning">
          Đang chuyển đến trang đăng nhập...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div
        className="rounded-4 p-4 p-md-5 mb-4 text-white"
        style={{
          background:
            "linear-gradient(135deg, #dc3545 0%, #e11d48 55%, #7f1d1d 100%)",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle bg-white text-danger d-flex align-items-center justify-content-center"
            style={{ width: 58, height: 58 }}
          >
            <LockKeyhole size={30} />
          </div>

          <div>
            <p className="text-uppercase small fw-bold mb-2 opacity-75">
              CineGo Admin
            </p>
            <h2 className="fw-bold mb-2">Thay đổi mật khẩu Admin</h2>
            <p className="mb-0 opacity-75">
              Cập nhật mật khẩu mới để bảo vệ tài khoản quản trị hệ thống.
            </p>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-8 col-lg-9">
          {error && <div className="alert alert-danger">{error}</div>}

          {success && <div className="alert alert-success">{success}</div>}

          <form
            onSubmit={handleSubmit}
            className="card border-0 shadow-sm rounded-4"
          >
            <div className="card-header bg-white border-bottom py-3 rounded-top-4">
              <div className="d-flex align-items-center gap-2">
                <ShieldCheck size={20} className="text-danger" />
                <h5 className="mb-0 fw-bold">Bảo mật tài khoản</h5>
              </div>
            </div>

            <div className="card-body p-4">
              <PasswordInput
                label="Mật khẩu cũ"
                value={oldPassword}
                show={showOldPassword}
                placeholder="Nhập mật khẩu cũ"
                onChange={setOldPassword}
                onToggle={() => setShowOldPassword((prev) => !prev)}
              />

              <PasswordInput
                label="Mật khẩu mới"
                value={newPassword}
                show={showNewPassword}
                placeholder="Nhập mật khẩu mới"
                onChange={setNewPassword}
                onToggle={() => setShowNewPassword((prev) => !prev)}
              />

              <PasswordInput
                label="Xác nhận mật khẩu mới"
                value={confirmPassword}
                show={showConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                onChange={setConfirmPassword}
                onToggle={() => setShowConfirmPassword((prev) => !prev)}
              />

              <div className="rounded-4 bg-light p-3 mt-3">
                <p className="fw-semibold mb-2">Yêu cầu mật khẩu:</p>
                <ul className="small text-muted mb-0">
                  <li>Ít nhất 8 ký tự</li>
                  <li>Có ít nhất 1 chữ hoa, 1 chữ thường</li>
                  <li>Có ít nhất 1 số</li>
                  <li>Có ít nhất 1 ký tự đặc biệt</li>
                </ul>
              </div>

              <div className="d-flex justify-content-between align-items-center gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => router.push("/admin/profile")}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="btn btn-danger d-flex align-items-center gap-2 px-4"
                  disabled={submitting}
                >
                  <Save size={18} />
                  {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

type PasswordInputProps = {
  label: string;
  value: string;
  show: boolean;
  placeholder: string;
  onChange: (value: string) => void;
  onToggle: () => void;
};

function PasswordInput({
  label,
  value,
  show,
  placeholder,
  onChange,
  onToggle,
}: PasswordInputProps) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>

      <div className="position-relative">
        <input
          type={show ? "text" : "password"}
          className="form-control"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingRight: 46 }}
        />

        {value && (
          <button
            type="button"
            className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-secondary p-0 me-3"
            onClick={onToggle}
            aria-label="Toggle password visibility"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
