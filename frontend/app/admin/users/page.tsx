"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { AdminUser } from "@/types/admin";
import { UserForm } from "@/types/user";
import { adminService } from "@/services/admin";

type ModalMode = "create" | "edit" | "view" | null;

const initialForm: UserForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  role: "user",
  password: "",
  confirmPassword: "",
};

function validatePassword(password: string) {
  if (!password.trim()) {
    return "Vui lòng nhập mật khẩu";
  }

  if (password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự";
  }

  if (!/[A-Z]/.test(password)) {
    return "Mật khẩu phải có ít nhất 1 chữ hoa";
  }

  if (!/[a-z]/.test(password)) {
    return "Mật khẩu phải có ít nhất 1 chữ thường";
  }

  if (!/[0-9]/.test(password)) {
    return "Mật khẩu phải có ít nhất 1 số";
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]/.test(password)) {
    return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
  }

  return "";
}

function validatePhone(phone?: string) {
  if (!phone?.trim()) return "";

  if (!/^(0|\+84)[0-9]{9,10}$/.test(phone.trim())) {
    return "Số điện thoại không hợp lệ";
  }

  return "";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<UserForm>(initialForm);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [message, setMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function fetchUsers() {
    try {
      setLoading(true);
      setMessage("");

      const data = await adminService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách người dùng",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    if (modalMode) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [modalMode]);

  const isError = useMemo(() => {
    const lower = message.toLowerCase();

    return (
      lower.includes("không") ||
      lower.includes("lỗi") ||
      lower.includes("thất bại") ||
      lower.includes("vui lòng") ||
      lower.includes("khớp") ||
      lower.includes("hợp lệ") ||
      lower.includes("error")
    );
  }, [message]);

  function resetPasswordVisibility() {
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function openCreate() {
    setForm(initialForm);
    setSelectedUser(null);
    setMessage("");
    resetPasswordVisibility();
    setModalMode("create");
  }

  function openEdit(user: AdminUser) {
    setSelectedUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role || "user",
      password: "",
      confirmPassword: "",
    });
    setMessage("");
    resetPasswordVisibility();
    setModalMode("edit");
  }

  function openView(user: AdminUser) {
    setSelectedUser(user);
    setMessage("");
    resetPasswordVisibility();
    setModalMode("view");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
    setForm(initialForm);
    setMessage("");
    resetPasswordVisibility();
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Vui lòng nhập tên người dùng";
    }

    if (!form.email.trim()) {
      return "Vui lòng nhập email";
    }

    const phoneError = validatePhone(form.phone);

    if (phoneError) {
      return phoneError;
    }

    if (modalMode === "create") {
      const passwordError = validatePassword(form.password || "");

      if (passwordError) {
        return passwordError;
      }

      if (!form.confirmPassword?.trim()) {
        return "Vui lòng nhập xác nhận mật khẩu";
      }

      if (form.password !== form.confirmPassword) {
        return "Mật khẩu và xác nhận mật khẩu không khớp";
      }
    }

    if (modalMode === "edit") {
      const hasPasswordInput =
        Boolean(form.password?.trim()) || Boolean(form.confirmPassword?.trim());

      if (hasPasswordInput) {
        const passwordError = validatePassword(form.password || "");

        if (passwordError) {
          return passwordError.replace("mật khẩu", "mật khẩu mới");
        }

        if (!form.confirmPassword?.trim()) {
          return "Vui lòng nhập xác nhận mật khẩu mới";
        }

        if (form.password !== form.confirmPassword) {
          return "Mật khẩu mới và xác nhận mật khẩu không khớp";
        }
      }
    }

    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === "edit" && selectedUser) {
        const payload: Partial<UserForm> = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone?.trim() || "",
          address: form.address?.trim() || "",
          role: form.role,
        };

        if (form.password?.trim()) {
          payload.password = form.password;
        }

        await adminService.updateUser(selectedUser.id, payload);
      } else {
        const payload: UserForm = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone?.trim() || "",
          address: form.address?.trim() || "",
          role: form.role,
          password: form.password,
          confirmPassword: form.confirmPassword,
        };

        await adminService.createUser(payload);
      }

      await fetchUsers();
      closeModal();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(userId: number) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa người dùng này?");
    if (!confirmed) return;

    try {
      setMessage("");
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err: unknown) {
      setMessage(
        err instanceof Error ? err.message : "Không thể xóa người dùng",
      );
    }
  }

  return (
    <>
      <div className="admin-page">
        <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Quản lý người dùng</h2>
            <p className="text-muted mb-0">
              Quản lý danh sách người dùng trong hệ thống CineGo
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreate}
          >
            + Thêm người dùng
          </button>
        </div>

        {message && !modalMode && (
          <div
            className={`alert ${isError ? "alert-danger" : "alert-success"}`}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="alert alert-secondary">Đang tải dữ liệu...</div>
        ) : (
          <div className="card border-0 shadow-sm admin-table-card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 admin-table">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 90 }}>ID</th>
                      <th>Tên</th>
                      <th>Email</th>
                      <th style={{ width: 150 }}>Role</th>
                      <th style={{ width: 170 }} className="text-center">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>

                          <td className="fw-semibold">{user.name}</td>

                          <td>{user.email}</td>

                          <td>
                            <span
                              className={`badge ${
                                user.role === "admin"
                                  ? "bg-danger"
                                  : "bg-secondary"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td className="text-center" style={{ width: 170 }}>
                            <div className="admin-action-group">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info btn-icon"
                                title="Xem"
                                aria-label="Xem"
                                onClick={() => openView(user)}
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary btn-icon"
                                title="Sửa"
                                aria-label="Sửa"
                                onClick={() => openEdit(user)}
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger btn-icon"
                                title="Xóa"
                                aria-label="Xóa"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          Không có dữ liệu người dùng
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {modalMode && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              zIndex: 1040,
            }}
            onClick={closeModal}
          />

          <div
            className="position-fixed top-50 start-50 translate-middle w-100 px-3"
            style={{ maxWidth: 720, zIndex: 1050 }}
          >
            <div
              className="card border-0 shadow-lg"
              onClick={(e) => e.stopPropagation()}
              style={{ borderRadius: 16 }}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">
                    {modalMode === "create" && "Thêm người dùng"}
                    {modalMode === "edit" && "Cập nhật người dùng"}
                    {modalMode === "view" && "Chi tiết người dùng"}
                  </h4>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={closeModal}
                  >
                    Đóng
                  </button>
                </div>

                {message && (
                  <div
                    className={`alert py-2 ${
                      isError ? "alert-danger" : "alert-success"
                    }`}
                  >
                    {message}
                  </div>
                )}

                {modalMode === "view" && selectedUser && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Tên</label>
                      <input
                        className="form-control"
                        value={selectedUser.name || "N/A"}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        className="form-control"
                        value={selectedUser.email || "N/A"}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Số điện thoại</label>
                      <input
                        className="form-control"
                        value={selectedUser.phone || "N/A"}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Vai trò</label>
                      <input
                        className="form-control"
                        value={selectedUser.role || "N/A"}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Địa chỉ</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={selectedUser.address || "N/A"}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                )}

                {(modalMode === "create" || modalMode === "edit") && (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Tên người dùng</label>
                        <input
                          type="text"
                          name="name"
                          placeholder="Nhập tên người dùng"
                          value={form.name}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          name="email"
                          placeholder="Nhập email"
                          value={form.email}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Số điện thoại</label>
                        <input
                          type="text"
                          name="phone"
                          placeholder="Nhập số điện thoại"
                          value={form.phone || ""}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Vai trò</label>
                        <select
                          name="role"
                          value={form.role}
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label">Địa chỉ</label>
                        <textarea
                          name="address"
                          placeholder="Nhập địa chỉ"
                          value={form.address || ""}
                          onChange={handleChange}
                          className="form-control"
                          rows={3}
                        />
                      </div>

                      <div className="col-md-6">
                        <PasswordInput
                          label={
                            modalMode === "edit" ? "Mật khẩu mới" : "Mật khẩu"
                          }
                          name="password"
                          value={form.password || ""}
                          show={showPassword}
                          placeholder={
                            modalMode === "edit"
                              ? "Không bắt buộc"
                              : "Nhập mật khẩu"
                          }
                          onChange={handleChange}
                          onToggle={() => setShowPassword((prev) => !prev)}
                        />
                      </div>

                      <div className="col-md-6">
                        <PasswordInput
                          label={
                            modalMode === "edit"
                              ? "Xác nhận mật khẩu mới"
                              : "Xác nhận mật khẩu"
                          }
                          name="confirmPassword"
                          value={form.confirmPassword || ""}
                          show={showConfirmPassword}
                          placeholder={
                            modalMode === "edit"
                              ? "Không bắt buộc"
                              : "Nhập lại mật khẩu"
                          }
                          onChange={handleChange}
                          onToggle={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                        />
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary"
                      >
                        {submitting
                          ? "Đang xử lý..."
                          : modalMode === "edit"
                            ? "Cập nhật"
                            : "Thêm mới"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeModal}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

type PasswordInputProps = {
  label: string;
  name: "password" | "confirmPassword";
  value: string;
  show: boolean;
  placeholder: string;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  onToggle: () => void;
};

function PasswordInput({
  label,
  name,
  value,
  show,
  placeholder,
  onChange,
  onToggle,
}: PasswordInputProps) {
  return (
    <div>
      <label className="form-label">{label}</label>

      <div className="position-relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="form-control"
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
