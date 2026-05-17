"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProtectAuth from "@/components/auth/ProtectAuth";

type Gender = "male" | "female" | "";

interface RegisterFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
  day: string;
  month: string;
  year: string;
  gender: Gender;
  area: string;
  agreed: boolean;
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="form-label fw-semibold">
      {children}
      <span className="text-danger">*</span>
    </label>
  );
}

function validatePassword(password: string) {
  if (!password.trim()) return "Vui lòng nhập mật khẩu";
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (!/[A-Z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ hoa";
  if (!/[a-z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ thường";
  if (!/[0-9]/.test(password)) return "Mật khẩu phải có ít nhất 1 số";

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]/.test(password)) {
    return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
  }

  return "";
}

function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState<RegisterFormData>({
    name: "",
    phone: "",
    email: "",
    password: "",
    day: "",
    month: "",
    year: "",
    gender: "",
    area: "",
    agreed: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof RegisterFormData>(
    key: K,
    value: RegisterFormData[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function validateForm() {
    if (!form.name.trim()) return "Vui lòng nhập tên";
    if (!form.phone.trim()) return "Vui lòng nhập số điện thoại";

    if (!/^(0|\+84)[0-9]{9,10}$/.test(form.phone.trim())) {
      return "Số điện thoại không hợp lệ";
    }

    if (!form.email.trim()) return "Vui lòng nhập email";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Email không hợp lệ";
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) return passwordError;

    if (!form.day || !form.month || !form.year) {
      return "Vui lòng chọn ngày sinh";
    }

    if (!form.gender) return "Vui lòng chọn giới tính";
    if (!form.area) return "Vui lòng chọn khu vực";

    if (!form.agreed) {
      return "Vui lòng xác nhận thông tin và đồng ý điều khoản";
    }

    return "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setMessage("");

    const errorMessage = validateForm();
    if (errorMessage) {
      setMessage(errorMessage);
      return;
    }

    try {
      setLoading(true);

      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.area,
        password: form.password,
      });

      setMessage("Đăng ký thành công, chuyển sang đăng nhập...");

      setTimeout(() => {
        router.replace("/login");
      }, 700);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  const years = Array.from({ length: 70 }, (_, index) =>
    String(new Date().getFullYear() - index),
  );

  const isSuccess = message.toLowerCase().includes("thành công");

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="row g-0 h-100">
          <div className="col-lg-5 d-none d-lg-flex auth-panel">
            <div className="auth-panel-content">
              <UserPlus size={68} className="mb-3" />
              <h2 className="fw-bold mb-3">Welcome Back!</h2>
              <p className="auth-panel-text">
                Đã có tài khoản? Đăng nhập để tiếp tục đặt vé cùng CineGo.
              </p>

              <Link href="/login" className="btn auth-panel-btn">
                <LogIn size={20} />
                Đăng nhập
              </Link>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="auth-form-wrap auth-form-wrap-register">
              <div className="w-100">
                <div className="auth-title-block">
                  <h1 className="auth-title">Đăng ký</h1>
                  <p className="auth-subtitle">
                    Tạo tài khoản để đặt vé và nhận ưu đãi thành viên.
                  </p>
                </div>

                {message && (
                  <div
                    className={`alert ${
                      isSuccess ? "alert-success" : "alert-danger"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <RequiredLabel>Tên</RequiredLabel>
                      <input
                        className="form-control auth-input"
                        placeholder="Tên"
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <RequiredLabel>Số điện thoại</RequiredLabel>
                      <input
                        className="form-control auth-input"
                        placeholder="Số điện thoại"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <RequiredLabel>Email</RequiredLabel>
                      <input
                        type="email"
                        className="form-control auth-input"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <RequiredLabel>Mật khẩu</RequiredLabel>

                      <div className="position-relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control auth-input pe-5"
                          placeholder="Mật khẩu"
                          value={form.password}
                          onChange={(e) => {
                            updateField("password", e.target.value);
                            if (!e.target.value) setShowPassword(false);
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

                    <div className="col-12">
                      <RequiredLabel>Ngày sinh</RequiredLabel>

                      <div className="row g-2 align-items-center">
                        <div className="col-4 col-md-3">
                          <select
                            className="form-select auth-input"
                            value={form.day}
                            onChange={(e) => updateField("day", e.target.value)}
                          >
                            <option value="">Ngày</option>

                            {Array.from({ length: 31 }, (_, index) => (
                              <option key={index + 1} value={String(index + 1)}>
                                {index + 1}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-4 col-md-3">
                          <select
                            className="form-select auth-input"
                            value={form.month}
                            onChange={(e) =>
                              updateField("month", e.target.value)
                            }
                          >
                            <option value="">Tháng</option>

                            {Array.from({ length: 12 }, (_, index) => (
                              <option key={index + 1} value={String(index + 1)}>
                                {index + 1}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-4 col-md-3">
                          <select
                            className="form-select auth-input"
                            value={form.year}
                            onChange={(e) =>
                              updateField("year", e.target.value)
                            }
                          >
                            <option value="">Năm</option>

                            {years.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-12 col-md-6">
                          <div className="d-flex align-items-center gap-4 h-100 ps-md-2 mt-2 mt-md-0">
                            <label className="d-flex align-items-center gap-2 fw-semibold mb-0">
                              <input
                                type="radio"
                                name="gender"
                                checked={form.gender === "male"}
                                onChange={() => updateField("gender", "male")}
                              />
                              Nam
                            </label>

                            <label className="d-flex align-items-center gap-2 fw-semibold mb-0">
                              <input
                                type="radio"
                                name="gender"
                                checked={form.gender === "female"}
                                onChange={() => updateField("gender", "female")}
                              />
                              Nữ
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <RequiredLabel>Khu vực</RequiredLabel>
                      <select
                        className="form-select auth-input"
                        value={form.area}
                        onChange={(e) => updateField("area", e.target.value)}
                      >
                        <option value="">Khu vực</option>
                        <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Phú Yên">Phú Yên</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <div className="form-check d-flex align-items-start gap-2">
                        <input
                          type="checkbox"
                          id="agreed"
                          className="form-check-input mt-1"
                          checked={form.agreed}
                          onChange={(e) =>
                            updateField("agreed", e.target.checked)
                          }
                        />
                        <label htmlFor="agreed" className="form-check-label">
                          Tôi xác thực thông tin đã nhập là đúng và đồng ý với{" "}
                          <Link href="/terms" className="auth-link fw-bold">
                            điều khoản
                          </Link>
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn auth-submit w-100"
                      >
                        {loading ? "Đang đăng ký..." : "Đăng ký"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <ProtectAuth requireAuth={false}>
      <RegisterForm />
    </ProtectAuth>
  );
}
