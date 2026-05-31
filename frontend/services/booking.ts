import { CreateBookingPayload, BookingHistoryItem } from "@/types/booking";
import {
  createBookingApi,
  getMyBookingsApi,
  getPaymentSummaryApi,
  cancelBookingApi,
  updateBookingInfoApi,
  type UpdateBookingInfoPayload,
} from "@/lib/api/bookings";

function toArray<T>(res: { data: unknown }): T[] {
  const raw = (res.data as Record<string, unknown>)?.data ?? res.data;
  return Array.isArray(raw) ? (raw as T[]) : [];
}

function normalizeUtcTimestamp(value?: string | null) {
  if (!value) return value || "";

  const trimmed = String(value).trim();

  if (!trimmed) return "";

  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);

  if (hasTimezone) {
    return trimmed;
  }

  return `${trimmed.replace(" ", "T")}Z`;
}

function normalizeBookingHistoryItem(
  item: BookingHistoryItem,
): BookingHistoryItem {
  return {
    ...item,
    created_at: normalizeUtcTimestamp(item.created_at),
  };
}

export type PaymentSummary = {
  showtimeId: number;
  movieTitle: string;
  startTime: string;
  roomName: string;
  totalPrice: number;
  seats: {
    id: number;
    seatLabel: string;
    type: string;
    price: number;
  }[];
};

export const bookingService = {
  async createBooking(payload: CreateBookingPayload) {
    const res = await createBookingApi(payload);
    return res.data;
  },

  async getMyBookings(): Promise<BookingHistoryItem[]> {
    const res = await getMyBookingsApi();

    return toArray<BookingHistoryItem>(res).map(normalizeBookingHistoryItem);
  },

  async getPaymentSummary(
    showtimeId: number,
    seatIds: number[],
  ): Promise<PaymentSummary> {
    const res = await getPaymentSummaryApi(showtimeId, seatIds);
    return (res.data as { data: PaymentSummary }).data;
  },

  async cancelBooking(bookingId: number) {
    const res = await cancelBookingApi(bookingId);
    return res.data;
  },

  async updateBookingInfo(
    bookingId: number,
    payload: UpdateBookingInfoPayload,
  ) {
    const res = await updateBookingInfoApi(bookingId, payload);
    return res.data;
  },
};
