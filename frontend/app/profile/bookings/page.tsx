"use client";

import { useCallback, useEffect, useState } from "react";
import { bookingService } from "@/services/booking";
import { BookingHistoryItem } from "@/types/booking";
import { useAuth } from "@/hooks/useAuth";
import ProtectAuth from "@/components/auth/ProtectAuth";

function statusText(status: string) {
  switch (status) {
    case "confirmed":
      return "Đã xác nhận";
    case "pending":
      return "Chờ xác nhận";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có dữ liệu";
  }

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function canManageBooking(item: BookingHistoryItem) {
  if (item.status !== "pending") return false;

  const showtimeTime = new Date(item.start_time).getTime();

  if (Number.isNaN(showtimeTime)) return false;

  return showtimeTime > Date.now();
}

function validateEditForm(form: {
  name: string;
  phone: string;
  email: string;
}) {
  if (!form.name.trim()) {
    return "Vui lòng nhập họ và tên";
  }

  if (!form.phone.trim()) {
    return "Vui lòng nhập số điện thoại";
  }

  const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

  if (!phoneRegex.test(form.phone.trim())) {
    return "Số điện thoại không hợp lệ";
  }

  if (!form.email.trim()) {
    return "Vui lòng nhập email";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(form.email.trim())) {
    return "Email không hợp lệ";
  }

  return "";
}

function MyBookingsContent() {
  const { token } = useAuth();

  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelLoadingId, setCancelLoadingId] = useState<number | null>(null);

  const [editingBooking, setEditingBooking] =
    useState<BookingHistoryItem | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    ticketDelivery: "email",
    note: "",
  });

  const [savingEdit, setSavingEdit] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await bookingService.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token, fetchBookings]);

  function openEditModal(item: BookingHistoryItem) {
    setEditingBooking(item);
    setEditForm({
      name: item.name || "",
      phone: item.phone || "",
      email: item.email || "",
      ticketDelivery: item.ticket_delivery || "email",
      note: item.note || "",
    });
  }

  function closeEditModal() {
    if (savingEdit) return;

    setEditingBooking(null);
    setEditForm({
      name: "",
      phone: "",
      email: "",
      ticketDelivery: "email",
      note: "",
    });
  }

  async function handleUpdateBookingInfo() {
    if (!editingBooking) return;

    const errorMessage = validateEditForm(editForm);

    if (errorMessage) {
      alert(errorMessage);
      return;
    }

    try {
      setSavingEdit(true);

      await bookingService.updateBookingInfo(editingBooking.booking_id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        ticketDelivery: editForm.ticketDelivery,
        note: editForm.note.trim(),
      });

      alert("Cập nhật thông tin đặt vé thành công");
      closeEditModal();
      await fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể cập nhật vé");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleCancelBooking(bookingId: number) {
    const confirmed = window.confirm("Bạn có chắc chắn muốn hủy vé này không?");

    if (!confirmed) return;

    try {
      setCancelLoadingId(bookingId);

      await bookingService.cancelBooking(bookingId);

      alert("Hủy vé thành công");
      await fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể hủy vé");
    } finally {
      setCancelLoadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" />
        <p className="mt-3">Đang tải lịch sử vé...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Lịch sử đặt vé</h2>

      {!bookings.length ? (
        <div className="alert alert-info">Bạn chưa có vé nào.</div>
      ) : (
        <div className="row g-3">
          {bookings.map((item) => {
            const manageable = canManageBooking(item);
            const isCancelling = cancelLoadingId === item.booking_id;

            return (
              <div key={item.booking_id} className="col-md-6">
                <div className="card shadow-sm h-100">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-semibold mb-3">
                      🎬 {item.movie_title}
                    </h5>

                    <p className="mb-1">
                      <strong>Mã booking:</strong> #{item.booking_id}
                    </p>

                    <p className="mb-1">
                      <strong>Suất chiếu:</strong>{" "}
                      {formatDateTime(item.start_time)}
                    </p>

                    <p className="mb-1">
                      <strong>Phòng:</strong> {item.room_name}
                    </p>

                    <p className="mb-1">
                      <strong>Ghế đã đặt:</strong>{" "}
                      {item.seat_names || "Chưa có dữ liệu"}
                    </p>

                    <p className="mb-1">
                      <strong>Người đặt:</strong>{" "}
                      {item.name || "Chưa có dữ liệu"}
                    </p>

                    <p className="mb-1">
                      <strong>Số điện thoại:</strong>{" "}
                      {item.phone || "Chưa có dữ liệu"}
                    </p>

                    <p className="mb-1">
                      <strong>Email:</strong> {item.email || "Chưa có dữ liệu"}
                    </p>

                    <p className="mb-1">
                      <strong>Thời gian đặt vé:</strong>{" "}
                      {formatDateTime(item.created_at)}
                    </p>

                    <p className="mb-1">
                      <strong>Tổng tiền:</strong>{" "}
                      <span className="text-danger fw-semibold">
                        {Number(item.total_price).toLocaleString("vi-VN")}đ
                      </span>
                    </p>

                    <p className="mb-3">
                      <strong>Trạng thái:</strong>{" "}
                      <span
                        className={`badge ${
                          item.status === "confirmed"
                            ? "bg-success"
                            : item.status === "pending"
                              ? "bg-warning text-dark"
                              : item.status === "cancelled"
                                ? "bg-danger"
                                : "bg-secondary"
                        }`}
                      >
                        {statusText(item.status)}
                      </span>
                    </p>

                    <div className="mt-auto">
                      {manageable ? (
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openEditModal(item)}
                          >
                            Sửa thông tin
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleCancelBooking(item.booking_id)}
                            disabled={isCancelling}
                          >
                            {isCancelling ? "Đang hủy..." : "Hủy vé"}
                          </button>
                        </div>
                      ) : item.status === "confirmed" ? (
                        <small className="text-muted">
                          Vé đã được xác nhận. Nếu cần hủy hoặc chỉnh sửa, vui
                          lòng liên hệ rạp.
                        </small>
                      ) : item.status === "cancelled" ? (
                        <small className="text-danger">
                          Vé này đã được hủy.
                        </small>
                      ) : (
                        <small className="text-muted">
                          Không thể chỉnh sửa hoặc hủy vé này.
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingBooking && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold">
                    Chỉnh sửa thông tin đặt vé
                  </h5>
                  <small className="text-muted">
                    Mã booking #{editingBooking.booking_id}
                  </small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body">
                <div className="alert alert-info rounded-3 small">
                  Bạn chỉ có thể chỉnh sửa thông tin liên hệ khi vé đang ở trạng
                  thái chờ xác nhận. Phim, suất chiếu và ghế không thể thay đổi
                  tại đây.
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Họ và tên <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control rounded-3"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nhập họ và tên"
                    disabled={savingEdit}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Số điện thoại <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control rounded-3"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Nhập số điện thoại"
                    disabled={savingEdit}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control rounded-3"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Nhập email"
                    disabled={savingEdit}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Phương thức nhận vé
                  </label>
                  <select
                    className="form-select rounded-3"
                    value={editForm.ticketDelivery}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        ticketDelivery: e.target.value,
                      }))
                    }
                    disabled={savingEdit}
                  >
                    <option value="email">Nhận vé qua email</option>
                    <option value="sms">Nhận mã vé qua SMS</option>
                    <option value="counter">Nhận vé tại quầy</option>
                  </select>
                </div>

                <div>
                  <label className="form-label fw-semibold">Ghi chú</label>
                  <textarea
                    className="form-control rounded-3"
                    rows={3}
                    value={editForm.note}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                    placeholder="Nhập ghi chú nếu có"
                    disabled={savingEdit}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-3"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                >
                  Đóng
                </button>

                <button
                  type="button"
                  className="btn btn-danger rounded-3"
                  onClick={handleUpdateBookingInfo}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <ProtectAuth requireAuth={true}>
      <MyBookingsContent />
    </ProtectAuth>
  );
}
