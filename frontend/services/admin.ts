import {
  getAdminUsersApi,
  createAdminUserApi,
  updateAdminUserApi,
  deleteAdminUserApi,
  getAdminMoviesApi,
  createAdminMovieApi,
  updateAdminMovieApi,
  deleteAdminMovieApi,
  getAdminBookingsApi,
  updateAdminBookingStatusApi,
  getAdminShowtimesApi,
  getAdminRoomsApi,
  createAdminShowtimeApi,
  updateAdminShowtimeApi,
  deleteAdminShowtimeApi,
} from "@/lib/api/admin";

import {
  AdminUser,
  AdminMovie,
  AdminBooking,
  AdminShowtime,
  UpdateBookingStatusPayload,
} from "@/types/admin";

import { AdminRoom, CreateShowtimePayload } from "@/types/admin";

import { UserForm } from "@/types/user";

function toArray<T>(res: { data: unknown }): T[] {
  const raw = (res.data as Record<string, unknown>)?.data ?? res.data;
  return Array.isArray(raw) ? (raw as T[]) : [];
}

export const adminService = {
  async getUsers(): Promise<AdminUser[]> {
    const res = await getAdminUsersApi();
    return toArray<AdminUser>(res);
  },

  async createUser(payload: UserForm) {
    const res = await createAdminUserApi(payload);
    return res.data;
  },

  async updateUser(userId: number, payload: Partial<UserForm>) {
    const res = await updateAdminUserApi(userId, payload);
    return res.data;
  },

  async deleteUser(userId: number) {
    const res = await deleteAdminUserApi(userId);
    return res.data;
  },

  async getMovies(): Promise<AdminMovie[]> {
    const res = await getAdminMoviesApi();
    return toArray<AdminMovie>(res);
  },

  async createMovie(payload: FormData) {
    const res = await createAdminMovieApi(payload);
    return res.data;
  },

  async updateMovie(movieId: number, payload: FormData) {
    const res = await updateAdminMovieApi(movieId, payload);
    return res.data;
  },

  async deleteMovie(movieId: number) {
    const res = await deleteAdminMovieApi(movieId);
    return res.data;
  },

  async getBookings(): Promise<AdminBooking[]> {
    const res = await getAdminBookingsApi();
    return toArray<AdminBooking>(res);
  },

  async updateBookingStatus(
    bookingId: number,
    payload: UpdateBookingStatusPayload,
  ) {
    const res = await updateAdminBookingStatusApi(bookingId, payload);
    return res.data;
  },

  async getShowtimes(): Promise<AdminShowtime[]> {
    const res = await getAdminShowtimesApi();
    return toArray<AdminShowtime>(res);
  },

  async getRooms(): Promise<AdminRoom[]> {
    const res = await getAdminRoomsApi();
    return toArray<AdminRoom>(res);
  },

  async createShowtime(payload: CreateShowtimePayload) {
    const res = await createAdminShowtimeApi(payload);
    return res.data;
  },

  async updateShowtime(
    showtimeId: number,
    payload: Partial<CreateShowtimePayload>,
  ) {
    const res = await updateAdminShowtimeApi(showtimeId, payload);
    return res.data;
  },

  async deleteShowtime(showtimeId: number) {
    const res = await deleteAdminShowtimeApi(showtimeId);
    return res.data;
  },
};

// import {
//   getAdminUsersApi,
//   createAdminUserApi,
//   updateAdminUserApi,
//   deleteAdminUserApi,
//   getAdminMoviesApi,
//   getAdminBookingsApi,
//   getAdminShowtimesApi,
// } from "@/lib/api/admin";
// import {
//   AdminUser,
//   AdminMovie,
//   AdminBooking,
//   AdminShowtime,
// } from "@/types/admin";
// import { UserForm } from "@/types/user";

// /** Safely extract an array from axios response */
// function toArray<T>(res: { data: unknown }): T[] {
//   const raw = (res.data as Record<string, unknown>)?.data ?? res.data;
//   return Array.isArray(raw) ? (raw as T[]) : [];
// }

// export const adminService = {
//   async getUsers(): Promise<AdminUser[]> {
//     const res = await getAdminUsersApi();
//     return toArray<AdminUser>(res);
//   },

//   async createUser(payload: UserForm) {
//     const res = await createAdminUserApi(payload);
//     return res.data;
//   },

//   async updateUser(userId: number, payload: Partial<UserForm>) {
//     const res = await updateAdminUserApi(userId, payload);
//     return res.data;
//   },

//   async deleteUser(userId: number) {
//     const res = await deleteAdminUserApi(userId);
//     return res.data;
//   },

//   async getMovies(): Promise<AdminMovie[]> {
//     const res = await getAdminMoviesApi();
//     return toArray<AdminMovie>(res);
//   },

//   async getBookings(): Promise<AdminBooking[]> {
//     const res = await getAdminBookingsApi();
//     return toArray<AdminBooking>(res);
//   },

//   async getShowtimes(): Promise<AdminShowtime[]> {
//     const res = await getAdminShowtimesApi();
//     return toArray<AdminShowtime>(res);
//   },
// };
