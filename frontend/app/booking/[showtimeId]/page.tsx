"use client";

import { useEffect, useMemo, useState } from "react";
import { moviesService } from "@/services/movies";
import SeatMap from "@/components/booking/SeatMap";
import { Seat } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";

function sortSeatsByRowAndCol(a: Seat, b: Seat) {
  const rowCompare = a.row_label.localeCompare(b.row_label, "en");
  if (rowCompare !== 0) return rowCompare;
  return a.col_number - b.col_number;
}

export default function BookingPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const params = useParams();

  const rawShowtimeId = params?.showtimeId;
  const showtimeId =
    typeof rawShowtimeId === "string" && !Number.isNaN(Number(rawShowtimeId))
      ? Number(rawShowtimeId)
      : null;

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!showtimeId) {
      setMessage("Không tìm thấy suất chiếu hợp lệ.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchSeats = async () => {
      try {
        setLoading(true);
        setMessage("");

        const data = await moviesService.getSeatsByShowtimeId(showtimeId);
        if (!isMounted) return;

        const normalizedSeats = Array.isArray(data) ? data : [];
        normalizedSeats.sort(sortSeatsByRowAndCol);

        setSeats(normalizedSeats);
      } catch (err) {
        console.error("API ERROR:", err);
        if (!isMounted) return;
        setMessage("Không tải được ghế");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSeats();

    return () => {
      isMounted = false;
    };
  }, [showtimeId]);

  const totalPrice = useMemo(
    () =>
      seats
        .filter((seat) => selectedSeats.includes(seat.id))
        .map((seat) => ({
          ...seat,
          price: seat.type === "vip" ? 120000 : 90000,
        }))
        .reduce((sum, seat) => sum + seat.price, 0),
    [seats, selectedSeats],
  );

  const chairString = useMemo(() => {
    return seats
      .filter((seat) => selectedSeats.includes(seat.id))
      .sort(sortSeatsByRowAndCol)
      .map((seat) => `${seat.row_label}${seat.col_number}`)
      .join(", ");
  }, [seats, selectedSeats]);

  function handleToggleSeat(seatId: number) {
    const seat = seats.find((item) => item.id === seatId);
    if (!seat) return;
    if (seat.is_booked) return;

    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId],
    );
  }

  function handleBooking() {
    if (!token) {
      router.push("/login");
      return;
    }

    if (isAdmin) {
      setMessage("Tài khoản admin chỉ được xem phim, không thể đặt vé.");
      return;
    }

    if (!showtimeId) {
      setMessage("Không tìm thấy suất chiếu hợp lệ.");
      return;
    }

    if (selectedSeats.length === 0) {
      setMessage("Vui lòng chọn ít nhất 1 ghế.");
      return;
    }

    router.push(
      `/payment?showtimeId=${showtimeId}&seats=${selectedSeats.join(",")}`,
    );
  }

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Đang tải sơ đồ ghế...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Chọn ghế</h1>
        <p className="text-muted mb-0">Vui lòng chọn vị trí ghế bạn muốn đặt</p>
      </div>

      {message && <div className="alert alert-danger">{message}</div>}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <SeatMap
                seats={seats}
                selectedSeats={selectedSeats}
                onToggleSeat={handleToggleSeat}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div
            className="card border-0 shadow-sm sticky-top"
            style={{ top: "100px" }}
          >
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3">Thông tin đặt vé</h2>

              <div className="mb-3">
                <div className="fw-semibold mb-2">Ghế đã chọn:</div>
                <div className="text-muted">
                  {chairString.length > 0 ? chairString : "Chưa chọn ghế"}
                </div>
              </div>

              <div className="mb-4">
                <div className="fw-semibold mb-2">Tổng tiền:</div>
                <div className="fs-5 fw-bold text-danger">
                  {totalPrice.toLocaleString("vi-VN")}đ
                </div>
              </div>

              <button
                type="button"
                onClick={handleBooking}
                className="btn btn-danger w-100"
                disabled={selectedSeats.length === 0 || isAdmin}
              >
                {isAdmin ? "Admin không thể đặt vé" : "Xác nhận đặt vé"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
