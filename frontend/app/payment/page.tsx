"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bookingService } from "@/services/booking";
import type { PaymentSummary } from "@/services/booking";
import { useAuth } from "@/hooks/useAuth";

type PaymentMethod = "cod" | "momo" | "vnpay";
type TicketDelivery = "email" | "sms" | "counter";

const DEMO_OTP = "123456";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuth();

  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [showtimeId, setShowtimeId] = useState<number>(0);
  const [seatIds, setSeatIds] = useState<number[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [ticketDelivery, setTicketDelivery] = useState<TicketDelivery>("email");
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

    setShowtimeId(Number.isInteger(stId) && stId > 0 ? stId : 0);

    if (seats) {
      const parsedSeatIds = seats
        .split(",")
        .map((seat) => Number(seat))
        .filter((seat) => Number.isInteger(seat) && seat > 0);

      setSeatIds(parsedSeatIds);
    } else {
      setSeatIds([]);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchPaymentSummary() {
      if (!token || !showtimeId || seatIds.length === 0) {
        setSummary(null);
        setSummaryError("");
        setSummaryLoading(false);
        return;
      }

      try {
        setSummaryLoading(true);
        setSummaryError("");
        setSummary(null);

        const data = await bookingService.getPaymentSummary(
          showtimeId,
          seatIds,
        );

        setSummary(data);
      } catch (error) {
        setSummary(null);
        setSummaryError(
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin thanh toán",
        );
      } finally {
        setSummaryLoading(false);
      }
    }

    fetchPaymentSummary();
  }, [token, showtimeId, seatIds]);

  function resetOnlinePaymentState() {
    setPaymentReference("");
    setPaymentVerified(false);
    setVerifyingPayment(false);
    setPaymentMessage("");
    setOtpSent(false);
    setOtpCode("");
  }

  function handlePaymentMethodChange(value: PaymentMethod) {
    setPaymentMethod(value);

    if (value === "cod") {
      setPaymentReference("");
      setPaymentVerified(true);
      setVerifyingPayment(false);
      setPaymentMessage("");
      setOtpSent(false);
      setOtpCode("");
      return;
    }

    resetOnlinePaymentState();
  }

  function handlePaymentReferenceChange(value: string) {
    setPaymentReference(value);
    setPaymentVerified(false);
    setPaymentMessage("");
    setOtpSent(false);
    setOtpCode("");
  }

  function handleOtpChange(value: string) {
    setOtpCode(value);
    setPaymentVerified(false);
    setPaymentMessage("");
  }

  function formatDateTime(value?: string) {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatMoney(value?: number) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
  }

  function getPaymentMethodLabel() {
    if (paymentMethod === "momo") return "Momo";
    if (paymentMethod === "vnpay") return "VNPay";
    return "Thanh toán tại quầy";
  }

  function getTicketDeliveryLabel() {
    if (ticketDelivery === "email") return "Qua email";
    if (ticketDelivery === "counter") return "Tại quầy";
    return "Qua SMS";
  }

  function validateOnlinePaymentInfo() {
    const value = paymentReference.trim();

    if (paymentMethod === "momo") {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

      if (!value) {
        return "Vui lòng nhập số điện thoại Momo";
      }

      if (!phoneRegex.test(value)) {
        return "Số điện thoại Momo không hợp lệ";
      }
    }

    if (paymentMethod === "vnpay") {
      const transactionRegex = /^[A-Za-z0-9_-]{6,30}$/;

      if (!value) {
        return "Vui lòng nhập mã giao dịch VNPay";
      }

      if (!transactionRegex.test(value)) {
        return "Mã giao dịch VNPay phải từ 6-30 ký tự, không chứa khoảng trắng";
      }
    }

    return "";
  }

  async function handleSendDemoOtp() {
    const error = validateOnlinePaymentInfo();

    if (error) {
      setPaymentVerified(false);
      setOtpSent(false);
      setOtpCode("");
      setPaymentMessage(error);
      return;
    }

    try {
      setVerifyingPayment(true);
      setPaymentMessage("");

      await new Promise((resolve) => setTimeout(resolve, 800));

      setOtpSent(true);
      setOtpCode("");
      setPaymentVerified(false);
      setPaymentMessage(`Mã OTP giả lập đã được gửi.`);
    } finally {
      setVerifyingPayment(false);
    }
  }

  async function handleVerifyOnlinePayment() {
    if (!otpSent) {
      setPaymentVerified(false);
      setPaymentMessage("Vui lòng gửi OTP giả lập trước khi xác minh.");
      return;
    }

    if (!otpCode.trim()) {
      setPaymentVerified(false);
      setPaymentMessage("Vui lòng nhập mã OTP.");
      return;
    }

    try {
      setVerifyingPayment(true);
      setPaymentMessage("");

      await new Promise((resolve) => setTimeout(resolve, 700));

      if (otpCode.trim() !== DEMO_OTP) {
        setPaymentVerified(false);
        setPaymentMessage("Mã OTP không chính xác. Vui lòng thử lại.");
        return;
      }

      setPaymentVerified(true);
      setPaymentMessage(
        `Xác minh thanh toán ${getPaymentMethodLabel()} thành công.`,
      );
    } finally {
      setVerifyingPayment(false);
    }
  }

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

    if (!showtimeId || seatIds.length === 0) {
      alert("Thiếu thông tin suất chiếu hoặc ghế");
      return false;
    }

    if (!summary) {
      alert("Không thể xác định thông tin phim, suất chiếu và ghế đã chọn");
      return false;
    }

    if (paymentMethod === "momo" || paymentMethod === "vnpay") {
      const paymentError = validateOnlinePaymentInfo();

      if (paymentError) {
        alert(paymentError);
        return false;
      }

      if (!otpSent) {
        alert("Vui lòng gửi OTP giả lập trước khi xác nhận thanh toán");
        return false;
      }

      if (!paymentVerified) {
        alert("Vui lòng xác minh OTP trước khi xác nhận thanh toán");
        return false;
      }
    }

    if (!agreeTerms) {
      alert("Vui lòng đồng ý điều khoản thanh toán");
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
        cardNumber: paymentMethod === "cod" ? "" : paymentReference.trim(),
        paymentVerified,
        ticketDelivery,
        note: note.trim(),
      });

      alert(
        paymentMethod === "cod"
          ? "Đặt vé thành công! Vui lòng thanh toán tại quầy."
          : "Thanh toán thành công!",
      );

      router.push("/profile/bookings");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  }

  const isOnlinePayment = paymentMethod === "momo" || paymentMethod === "vnpay";

  const disableSubmit =
    loading ||
    summaryLoading ||
    Boolean(summaryError) ||
    !summary ||
    (isOnlinePayment && !paymentVerified);

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

                      {summaryLoading ? (
                        <div className="alert alert-info rounded-4 mb-0">
                          Đang tải thông tin đơn hàng...
                        </div>
                      ) : summaryError ? (
                        <div className="alert alert-danger rounded-4 mb-0">
                          {summaryError}
                        </div>
                      ) : (
                        <div className="bg-body-tertiary rounded-4 p-3 mb-3">
                          <div className="d-flex justify-content-between mb-2 gap-3">
                            <span className="text-muted">Tên phim</span>
                            <strong className="text-end">
                              {summary?.movieTitle || "--"}
                            </strong>
                          </div>

                          <div className="d-flex justify-content-between mb-2 gap-3">
                            <span className="text-muted">Ngày giờ chiếu</span>
                            <strong className="text-end">
                              {formatDateTime(summary?.startTime)}
                            </strong>
                          </div>

                          <div className="d-flex justify-content-between mb-2 gap-3">
                            <span className="text-muted">Phòng chiếu</span>
                            <strong className="text-end">
                              {summary?.roomName || "--"}
                            </strong>
                          </div>

                          <div className="d-flex justify-content-between mb-2 gap-3">
                            <span className="text-muted">Ghế đã chọn</span>
                            <strong className="text-end">
                              {summary?.seats?.length
                                ? summary.seats
                                    .map((seat) => seat.seatLabel)
                                    .join(", ")
                                : "--"}
                            </strong>
                          </div>

                          <div className="d-flex justify-content-between mb-2 gap-3">
                            <span className="text-muted">Số lượng ghế</span>
                            <strong>
                              {summary?.seats?.length || seatIds.length}
                            </strong>
                          </div>

                          <div className="d-flex justify-content-between mb-2 gap-3">
                            <span className="text-muted">Tổng tiền</span>
                            <strong className="text-danger">
                              {formatMoney(summary?.totalPrice)}
                            </strong>
                          </div>

                          <div className="d-flex justify-content-between gap-3">
                            <span className="text-muted">
                              Hình thức nhận vé
                            </span>
                            <strong className="text-end">
                              {getTicketDeliveryLabel()}
                            </strong>
                          </div>
                        </div>
                      )}

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
                            onChange={(e) =>
                              setTicketDelivery(
                                e.target.value as TicketDelivery,
                              )
                            }
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
                                  checked={paymentMethod === "cod"}
                                  onChange={() =>
                                    handlePaymentMethodChange("cod")
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
                                  checked={paymentMethod === "momo"}
                                  onChange={() =>
                                    handlePaymentMethodChange("momo")
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
                                  checked={paymentMethod === "vnpay"}
                                  onChange={() =>
                                    handlePaymentMethodChange("vnpay")
                                  }
                                  className="me-2"
                                />
                                VNPay
                              </label>
                            </div>
                          </div>
                        </div>

                        {isOnlinePayment && (
                          <div className="col-12">
                            <div className="border rounded-4 p-3 bg-body-tertiary">
                              <label className="form-label fw-semibold">
                                {paymentMethod === "momo"
                                  ? "Số điện thoại Momo"
                                  : "Mã giao dịch VNPay"}
                              </label>

                              <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder={
                                  paymentMethod === "momo"
                                    ? "Ví dụ: 0912345678"
                                    : "Ví dụ: VNPAY20260529001"
                                }
                                value={paymentReference}
                                onChange={(e) =>
                                  handlePaymentReferenceChange(e.target.value)
                                }
                              />

                              <div className="d-flex flex-column flex-md-row gap-2 mt-3">
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary rounded-3"
                                  onClick={handleSendDemoOtp}
                                  disabled={verifyingPayment || paymentVerified}
                                >
                                  {otpSent
                                    ? "Gửi lại OTP"
                                    : `Gửi OTP ${getPaymentMethodLabel()}`}
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-outline-danger rounded-3"
                                  onClick={handleVerifyOnlinePayment}
                                  disabled={
                                    verifyingPayment ||
                                    paymentVerified ||
                                    !otpSent
                                  }
                                >
                                  {verifyingPayment
                                    ? "Đang xử lý..."
                                    : paymentVerified
                                      ? "Đã xác minh"
                                      : "Xác minh OTP"}
                                </button>
                              </div>

                              {otpSent && !paymentVerified && (
                                <div className="mt-3">
                                  <label className="form-label fw-semibold">
                                    Nhập mã OTP
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control rounded-3"
                                    value={otpCode}
                                    onChange={(e) =>
                                      handleOtpChange(e.target.value)
                                    }
                                    maxLength={6}
                                  />
                                </div>
                              )}

                              {paymentMessage && (
                                <div
                                  className={`small fw-semibold mt-3 ${
                                    paymentVerified
                                      ? "text-success"
                                      : "text-danger"
                                  }`}
                                >
                                  {paymentMessage}
                                </div>
                              )}
                            </div>
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
                            disabled={disableSubmit}
                          >
                            {loading
                              ? "Đang xử lý..."
                              : paymentMethod === "cod"
                                ? "Xác nhận đặt vé"
                                : "Xác nhận thanh toán"}
                          </button>
                        </div>

                        {isOnlinePayment && !paymentVerified && (
                          <div className="col-12">
                            <div className="alert alert-info rounded-4 mb-0">
                              Vui lòng gửi OTP và xác minh thanh toán{" "}
                              {getPaymentMethodLabel()} trước khi xác nhận.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {summaryError && (
            <div className="alert alert-danger mt-3 rounded-4">
              {summaryError}
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
