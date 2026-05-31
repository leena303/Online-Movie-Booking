export interface BookingHistoryItem {
  booking_id: number;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  movie_title: string;
  start_time: string;
  room_name: string;
  seat_names?: string;
  name?: string;
  phone?: string;
  email?: string;
  payment_method?: string;
  payment_status?: string;
  ticket_delivery?: string | null;
  note?: string | null;
}

export type CreateBookingPayload = {
  showtimeId: number;
  seatIds: number[];
  name: string;
  phone: string;
  email: string;
  paymentMethod: string;
  paymentVerified?: boolean;
  cardNumber?: string;
  ticketDelivery?: string;
  note?: string;
};
