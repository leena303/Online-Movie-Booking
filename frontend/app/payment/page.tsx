"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bookingService } from "@/services/booking";
import { useAuth } from "@/hooks/useAuth";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuth();

  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [showtimeId, setShowtimeId] = useState<number>(0);
  const [seatIds, setSeatIds] = useState<number[]>([]);
  const [movieTitle, setMovieTitle] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [cardNumber, setCardNumber] = useState("");

  const [ticketDelivery, setTicketDelivery] = useState("email");
  const [note, setNote] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      alert("Tài khoản admin chỉ được xem phim, không thể đặt vé.");
      router.replace("/");
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    const stId = Number(searchParams.get("showtimeId"));
    const seats = searchParams.get("seats");
    const title =
      searchParams.get("movieTitle") ||
      searchParams.get("movie") ||
      searchParams.get("title") ||
      "";

    if (stId) {
      setShowtimeId(stId);
    }

    if (seats) {
      setSeatIds(
        seats
          .split(",")
          .map((seat) => Number(seat))
          .filter((seat) => !Number.isNaN(seat)),
      );
    }

    if (title) {
      setMovieTitle(decodeURIComponent(title));
    }
  }, [searchParams]);

  function validate() {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      alert("Email không hợp lệ");
      return false;
    }

    const phoneRegex = /^(0|\+84)\d{9,10}$/;

    if (!phoneRegex.test(phone.trim())) {
      alert("Số điện thoại không hợp lệ");
      return false;
    }

    if (
      (paymentMethod === "momo" || paymentMethod === "vnpay") &&
      !cardNumber.trim()
    ) {
      alert("Vui lòng nhập thông tin thanh toán");
      return false;
    }

    if (!agreeTerms) {
      alert("Vui lòng đồng ý điều khoản thanh toán");
      return false;
    }

    if (!showtimeId || seatIds.length === 0) {
      alert("Thiếu thông tin suất chiếu hoặc ghế");
      return false;
    }

    return true;
  }

  async function handlePayment() {
    if (!token) {
      alert("Bạn cần đăng nhập");
      router.push("/login");
      return;
    }

    if (isAdmin) {
      alert("Tài khoản admin chỉ được xem phim, không thể đặt vé.");
      router.replace("/");
      return;
    }

    if (!validate()) return;

    try {
      setLoading(true);

      await bookingService.createBooking({
        showtimeId,
        seatIds,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        paymentMethod,
        cardNumber: cardNumber.trim(),
        ticketDelivery,
        note: note.trim(),
      });

      alert("Thanh toán thành công!");
      router.push("/profile/bookings");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card border-0 shadow rounded-4 overflow-hidden">
            <div className="bg-danger text-white p-4">
              <h2 className="fw-bold mb-1 text-center">
                Thanh toán vé xem phim
              </h2>
              <p className="mb-0 text-center opacity-75">
                Hoàn tất thông tin để xác nhận đặt vé của bạn
              </p>
            </div>

            <div className="card-body p-4 p-md-5 bg-light">
              <div className="row g-4">
                <div className="col-lg-5">
                  <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-body p-4">
                      <h5 className="fw-bold mb-3">Thông tin đơn hàng</h5>

                      <div className="bg-body-tertiary rounded-4 p-3 mb-3">
                        <div className="d-flex justify-content-between mb-2 gap-3">
                          <span className="text-muted">Tên phim</span>
                          <strong className="text-end">
                            {movieTitle || "--"}
                          </strong>
                        </div>

                        <div className="d-flex justify-content-between mb-2 gap-3">
                          <span className="text-muted">Showtime ID</span>
                          <strong>{showtimeId || "--"}</strong>
                        </div>

                        <div className="d-flex justify-content-between mb-2 gap-3">
                          <span className="text-muted">Ghế đã chọn</span>
                          <strong className="text-end">
                            {seatIds.length > 0 ? seatIds.join(", ") : "--"}
                          </strong>
                        </div>

                        <div className="d-flex justify-content-between mb-2 gap-3">
                          <span className="text-muted">Số lượng ghế</span>
                          <strong>{seatIds.length}</strong>
                        </div>

                        <div className="d-flex justify-content-between gap-3">
                          <span className="text-muted">Hình thức nhận vé</span>
                          <strong className="text-end">
                            {ticketDelivery === "email"
                              ? "Qua email"
                              : ticketDelivery === "counter"
                                ? "Tại quầy"
                                : "Qua SMS"}
                          </strong>
                        </div>
                      </div>

                      <div className="alert alert-warning rounded-4 mb-0">
                        <small>
                          Vui lòng kiểm tra kỹ thông tin trước khi thanh toán.
                          Vé sau khi xác nhận có thể được gửi theo hình thức bạn
                          đã chọn.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-7">
                  <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-4">
                      <h5 className="fw-bold mb-4">Thông tin khách hàng</h5>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Họ và tên
                          </label>
                          <input
                            type="text"
                            className="form-control rounded-3"
                            placeholder="Nhập họ và tên"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Số điện thoại
                          </label>
                          <input
                            type="text"
                            className="form-control rounded-3"
                            placeholder="Nhập số điện thoại"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">
                            Email
                          </label>
                          <input
                            type="email"
                            className="form-control rounded-3"
                            placeholder="Nhập email nhận vé"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">
                            Phương thức nhận vé
                          </label>
                          <select
                            className="form-select rounded-3"
                            value={ticketDelivery}
                            onChange={(e) => setTicketDelivery(e.target.value)}
                          >
                            <option value="email">Nhận vé qua email</option>
                            <option value="sms">Nhận mã vé qua SMS</option>
                            <option value="counter">Nhận vé tại quầy</option>
                          </select>
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">
                            Ghi chú
                          </label>
                          <textarea
                            className="form-control rounded-3"
                            rows={3}
                            placeholder="Nhập ghi chú nếu có"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">
                            Phương thức thanh toán
                          </label>

                          <div className="row g-2">
                            <div className="col-md-4">
                              <label className="border rounded-3 p-3 w-100 h-100">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="cod"
                                  checked={paymentMethod === "cod"}
                                  onChange={(e) =>
                                    setPaymentMethod(e.target.value)
                                  }
                                  className="me-2"
                                />
                                Thanh toán tại quầy
                              </label>
                            </div>

                            <div className="col-md-4">
                              <label className="border rounded-3 p-3 w-100 h-100">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="momo"
                                  checked={paymentMethod === "momo"}
                                  onChange={(e) =>
                                    setPaymentMethod(e.target.value)
                                  }
                                  className="me-2"
                                />
                                Momo
                              </label>
                            </div>

                            <div className="col-md-4">
                              <label className="border rounded-3 p-3 w-100 h-100">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="vnpay"
                                  checked={paymentMethod === "vnpay"}
                                  onChange={(e) =>
                                    setPaymentMethod(e.target.value)
                                  }
                                  className="me-2"
                                />
                                VNPay
                              </label>
                            </div>
                          </div>
                        </div>

                        {(paymentMethod === "momo" ||
                          paymentMethod === "vnpay") && (
                          <div className="col-12">
                            <label className="form-label fw-semibold">
                              Thông tin thanh toán
                            </label>
                            <input
                              type="text"
                              className="form-control rounded-3"
                              placeholder={
                                paymentMethod === "momo"
                                  ? "Nhập số điện thoại Momo"
                                  : "Nhập mã giao dịch VNPay"
                              }
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                            />
                          </div>
                        )}

                        <div className="col-12">
                          <div className="form-check">
                            <input
                              id="agreeTerms"
                              type="checkbox"
                              className="form-check-input"
                              checked={agreeTerms}
                              onChange={(e) => setAgreeTerms(e.target.checked)}
                            />
                            <label
                              htmlFor="agreeTerms"
                              className="form-check-label"
                            >
                              Tôi đồng ý với điều khoản thanh toán và xác nhận
                              thông tin đặt vé là chính xác.
                            </label>
                          </div>
                        </div>

                        <div className="col-12">
                          <button
                            type="button"
                            className="btn btn-danger w-100 rounded-3 py-2 fw-bold"
                            onClick={handlePayment}
                            disabled={loading}
                          >
                            {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!movieTitle && (
            <div className="alert alert-info mt-3 rounded-4">
              Trang thanh toán chưa nhận được tên phim từ URL. Hãy truyền thêm
              query <strong>movieTitle</strong> từ trang chọn ghế hoặc trang
              suất chiếu.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-5">
          <div className="alert alert-info">Đang tải trang thanh toán...</div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
