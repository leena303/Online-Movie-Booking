import axiosInstance from "@/lib/axios";
import { UpdateBookingStatusPayload } from "@/types/admin";
import { UserForm } from "@/types/user";
import { CreateShowtimePayload } from "@/types/admin";

// USERS
export function getAdminUsersApi() {
  return axiosInstance.get("/admin/users");
}

export function createAdminUserApi(payload: UserForm) {
  return axiosInstance.post("/admin/users", payload);
}

export function updateAdminUserApi(userId: number, payload: Partial<UserForm>) {
  return axiosInstance.put(`/admin/users/${userId}`, payload);
}

export function deleteAdminUserApi(userId: number) {
  return axiosInstance.delete(`/admin/users/${userId}`);
}

// MOVIES
export function getAdminMoviesApi() {
  return axiosInstance.get("/admin/movies");
}

export function createAdminMovieApi(payload: FormData) {
  return axiosInstance.post("/admin/movies", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function updateAdminMovieApi(movieId: number, payload: FormData) {
  return axiosInstance.put(`/admin/movies/${movieId}`, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function deleteAdminMovieApi(movieId: number) {
  return axiosInstance.delete(`/admin/movies/${movieId}`);
}

// BOOKINGS
export function getAdminBookingsApi() {
  return axiosInstance.get("/admin/bookings");
}

export function updateAdminBookingStatusApi(
  bookingId: number,
  payload: UpdateBookingStatusPayload,
) {
  return axiosInstance.put(`/admin/bookings/${bookingId}/status`, payload);
}

// SHOWTIMES
export function getAdminShowtimesApi() {
  return axiosInstance.get("/admin/showtimes");
}

export function getAdminRoomsApi() {
  return axiosInstance.get("/admin/rooms");
}

export function createAdminShowtimeApi(payload: CreateShowtimePayload) {
  return axiosInstance.post("/admin/showtimes", payload);
}

export function updateAdminShowtimeApi(
  showtimeId: number,
  payload: Partial<CreateShowtimePayload>,
) {
  return axiosInstance.put(`/admin/showtimes/${showtimeId}`, payload);
}

export function deleteAdminShowtimeApi(showtimeId: number) {
  return axiosInstance.delete(`/admin/showtimes/${showtimeId}`);
}
