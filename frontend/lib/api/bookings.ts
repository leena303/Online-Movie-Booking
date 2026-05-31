import axiosInstance from "@/lib/axios";
import { CreateBookingPayload } from "@/types/booking";

export function createBookingApi(payload: CreateBookingPayload) {
  return axiosInstance.post("/bookings", payload);
}

export function getMyBookingsApi() {
  return axiosInstance.get("/bookings/my-bookings");
}

export function getPaymentSummaryApi(showtimeId: number, seatIds: number[]) {
  return axiosInstance.get("/bookings/payment-summary", {
    params: {
      showtimeId,
      seatIds: seatIds.join(","),
    },
  });
}

export function cancelBookingApi(bookingId: number) {
  return axiosInstance.put(`/bookings/${bookingId}/cancel`);
}

export type UpdateBookingInfoPayload = {
  name: string;
  phone: string;
  email: string;
  ticketDelivery?: string;
  note?: string;
};

export function updateBookingInfoApi(
  bookingId: number,
  payload: UpdateBookingInfoPayload,
) {
  return axiosInstance.put(`/bookings/${bookingId}`, payload);
}
