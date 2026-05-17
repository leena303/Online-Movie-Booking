"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProtectAuth from "@/components/auth/ProtectAuth";

interface LoginFormData {
  email: string;
  password: string;
}

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Email không hợp lệ");
      return;
    }

    try {
      setLoading(true);

      const data = await login({
        email: form.email.trim(),
        password: form.password,
      });

      setSuccess("Đăng nhập thành công, đang chuyển trang...");

      const role = data.user.role?.toLowerCase();

      setTimeout(() => {
        router.replace(role === "admin" ? "/admin" : "/");
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại";

      if (
        message.toLowerCase().includes("invalid email or password") ||
        message.toLowerCase().includes("email hoặc mật khẩu không đúng")
      ) {
        setError("Email hoặc mật khẩu không đúng");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="row g-0 h-100">
          <div className="col-lg-6">
            <div className="auth-form-wrap">
              <div className="w-100">
                <div className="auth-title-block">
                  <h1 className="auth-title">Đăng nhập</h1>
                  <p className="auth-subtitle">
                    Chào mừng bạn quay lại CineGo.
                  </p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && (
                  <div className="alert alert-success">{success}</div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Email hoặc số điện thoại
                    </label>
                    <input
                      type="email"
                      className="form-control auth-input"
                      placeholder="Nhập email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Mật khẩu</label>

                    <div className="position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control auth-input pe-5"
                        placeholder="Nhập mật khẩu"
                        value={form.password}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            password: value,
                          }));
                          if (!value) setShowPassword(false);
                        }}
                      />

                      {form.password && (
                        <button
                          type="button"
                          className="auth-eye-btn"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label="Toggle password"
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-end mb-4">
                    <Link href="/forgot-password" className="auth-link">
                      Quên mật khẩu?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn auth-submit w-100 mt-3"
                  >
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-6 d-none d-lg-flex auth-panel">
            <div className="auth-panel-content">
              <LogIn size={66} className="mb-4" />
              <h2 className="fw-bold mb-3">Hello, Welcome!</h2>
              <p className="auth-panel-text">
                Chưa có tài khoản? Đăng ký để đặt vé nhanh hơn và nhận ưu đãi.
              </p>

              <Link href="/register" className="btn auth-panel-btn">
                <UserPlus size={20} />
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <ProtectAuth requireAuth={false}>
      <LoginForm />
    </ProtectAuth>
  );
}
