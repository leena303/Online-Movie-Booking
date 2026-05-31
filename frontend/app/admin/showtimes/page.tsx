"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { AdminMovie, AdminRoom, AdminShowtime } from "@/types/admin";
import { adminService } from "@/services/admin";

type ModalMode = "create" | "edit" | "view" | null;
type ShowtimeStatus = "all" | "upcoming" | "showing" | "ended";

type ShowtimeForm = {
  movie_id: number | "";
  room_id: number | "";
  start_time: string;
};

const initialForm: ShowtimeForm = {
  movie_id: "",
  room_id: "",
  start_time: "",
};

function formatDateTime(value?: string) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("vi-VN");
}

function toLocalDateValue(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDatetimeLocal(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

function getEndTime(showtime: AdminShowtime, durationMin?: number) {
  const start = new Date(showtime.start_time);

  if (Number.isNaN(start.getTime()) || !durationMin) {
    return null;
  }

  return new Date(start.getTime() + durationMin * 60 * 1000);
}

function getShowtimeStatus(showtime: AdminShowtime, durationMin?: number) {
  const now = new Date();
  const start = new Date(showtime.start_time);
  const end = getEndTime(showtime, durationMin);

  if (Number.isNaN(start.getTime())) {
    return { label: "Không xác định", value: "unknown" as const };
  }

  if (!end || now < start) {
    return { label: "Sắp chiếu", value: "upcoming" as const };
  }

  if (now >= start && now <= end) {
    return { label: "Đang chiếu", value: "showing" as const };
  }

  return { label: "Đã kết thúc", value: "ended" as const };
}

function AdminShowtimesContent() {
  const searchParams = useSearchParams();

  const [showtimes, setShowtimes] = useState<AdminShowtime[]>([]);
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedShowtime, setSelectedShowtime] =
    useState<AdminShowtime | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<AdminMovie | null>(null);
  const [form, setForm] = useState<ShowtimeForm>(initialForm);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShowtimeStatus>("all");

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [showtimesData, moviesData, roomsData] = await Promise.all([
        adminService.getShowtimes(),
        adminService.getMovies(),
        adminService.getRooms(),
      ]);

      setShowtimes(Array.isArray(showtimesData) ? showtimesData : []);
      setMovies(Array.isArray(moviesData) ? moviesData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
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

  useEffect(() => {
    const movieId = Number(searchParams.get("movieId"));
    if (!movieId || movies.length === 0) return;

    const movie = movies.find((item) => item.id === movieId);
    if (!movie) return;

    setSelectedMovie(movie);
    setSelectedShowtime(null);
    setForm({
      movie_id: movie.id,
      room_id: "",
      start_time: "",
    });
    setModalMode("create");
  }, [searchParams, movies]);

  const roomMap = useMemo(() => {
    return new Map(rooms.map((room) => [room.id, room]));
  }, [rooms]);

  const normalizedRooms = useMemo(() => {
    const seen = new Set<string>();

    const deduped = rooms.filter((room) => {
      const name = (room.name || "").trim().toLowerCase();

      if (!name) return false;
      if (seen.has(name)) return false;

      seen.add(name);
      return true;
    });

    const preferred = deduped.filter((room) => {
      const name = (room.name || "").trim().toLowerCase();

      return (
        name === "phòng 1" ||
        name === "phong 1" ||
        name === "room 1" ||
        name === "phòng 2" ||
        name === "phong 2" ||
        name === "room 2"
      );
    });

    return preferred.length > 0 ? preferred : deduped.slice(0, 2);
  }, [rooms]);

  const filteredMovies = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return movies
      .map((movie) => {
        const movieShowtimes = showtimes.filter(
          (showtime) => Number(showtime.movie_id) === Number(movie.id),
        );

        const filteredShowtimes = movieShowtimes.filter((showtime) => {
          const matchDate =
            !dateFilter || toLocalDateValue(showtime.start_time) === dateFilter;

          const showtimeStatus = getShowtimeStatus(
            showtime,
            movie.duration_min,
          ).value;

          const matchStatus =
            statusFilter === "all" || showtimeStatus === statusFilter;

          return matchDate && matchStatus;
        });

        return {
          movie,
          showtimes: filteredShowtimes,
        };
      })
      .filter(({ movie, showtimes }) => {
        const matchKeyword =
          !keyword || movie.title.toLowerCase().includes(keyword);

        if (!matchKeyword) return false;

        if (dateFilter || statusFilter !== "all") {
          return showtimes.length > 0;
        }

        return true;
      });
  }, [movies, showtimes, searchKeyword, dateFilter, statusFilter]);

  const selectedMovieShowtimes = useMemo(() => {
    if (!selectedMovie) return [];

    return showtimes
      .filter(
        (showtime) => Number(showtime.movie_id) === Number(selectedMovie.id),
      )
      .filter((showtime) => {
        const matchDate =
          !dateFilter || toLocalDateValue(showtime.start_time) === dateFilter;

        const showtimeStatus = getShowtimeStatus(
          showtime,
          selectedMovie.duration_min,
        ).value;

        const matchStatus =
          statusFilter === "all" || showtimeStatus === statusFilter;

        return matchDate && matchStatus;
      })
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );
  }, [selectedMovie, showtimes, dateFilter, statusFilter]);

  function handleInputChange<K extends keyof ShowtimeForm>(
    key: K,
    value: ShowtimeForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function closeModal() {
    setModalMode(null);
    setSelectedShowtime(null);
    setSelectedMovie(null);
    setForm(initialForm);
    setError("");
  }

  function openCreateModal(movie?: AdminMovie) {
    setSelectedMovie(movie || null);
    setSelectedShowtime(null);
    setForm({
      movie_id: movie?.id ?? "",
      room_id: "",
      start_time: "",
    });
    setModalMode("create");
    setError("");
  }

  function openViewModal(movie: AdminMovie) {
    setSelectedMovie(movie);
    setSelectedShowtime(null);
    setModalMode("view");
    setError("");
  }

  function openEditModal(showtime: AdminShowtime, movie: AdminMovie) {
    setSelectedMovie(movie);
    setSelectedShowtime(showtime);
    setForm({
      movie_id: showtime.movie_id,
      room_id: showtime.room_id,
      start_time: toDatetimeLocal(showtime.start_time),
    });
    setModalMode("edit");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.movie_id || !form.room_id || !form.start_time) {
      setError("Vui lòng chọn phim, phòng và thời gian chiếu");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        movie_id: Number(form.movie_id),
        room_id: Number(form.room_id),
        start_time: new Date(form.start_time).toISOString(),
        price: 0,
        subtitle: "Phụ đề",
      };

      if (modalMode === "edit" && selectedShowtime) {
        await adminService.updateShowtime(selectedShowtime.id, payload);
      } else {
        await adminService.createShowtime(payload);
      }

      await fetchData();
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể lưu lịch chiếu");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa lịch chiếu này?");
    if (!confirmed) return;

    try {
      setError("");
      await adminService.deleteShowtime(id);
      await fetchData();

      if (selectedShowtime?.id === id) {
        setSelectedShowtime(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể xóa lịch chiếu");
    }
  }

  function resetFilters() {
    setSearchKeyword("");
    setDateFilter("");
    setStatusFilter("all");
  }

  return (
    <>
      <div className="admin-page">
        <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Quản lý lịch chiếu</h2>
            <p className="text-muted mb-0">
              Theo dõi và xử lý các lịch chiếu phim trong hệ thống
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCreateModal()}
          >
            + Thêm lịch chiếu
          </button>
        </div>

        <div className="card border-0 shadow-sm admin-table-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-5">
                <label className="form-label">Tìm theo tên phim</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập tên phim..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Lọc theo ngày</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">Trạng thái</label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as ShowtimeStatus)
                  }
                >
                  <option value="all">Tất cả</option>
                  <option value="upcoming">Sắp chiếu</option>
                  <option value="showing">Đang chiếu</option>
                  <option value="ended">Đã kết thúc</option>
                </select>
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={resetFilters}
                >
                  Xóa lọc
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="alert alert-secondary">Đang tải dữ liệu...</div>
        )}

        {error && !modalMode && (
          <div className="alert alert-danger">{error}</div>
        )}

        {!loading && !error && (
          <div className="card border-0 shadow-sm admin-table-card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 admin-table">
                  <thead className="table-light">
                    <tr>
                      <th>Tên phim</th>
                      <th style={{ width: 170 }}>Trạng thái phim</th>
                      <th style={{ width: 150 }}>Số suất chiếu</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMovies.length > 0 ? (
                      filteredMovies.map(({ movie, showtimes }) => (
                        <tr
                          key={movie.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => openViewModal(movie)}
                          title="Bấm để xem lịch chiếu"
                        >
                          <td className="admin-table-title fw-semibold">
                            {movie.title}
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                movie.status === "now_showing"
                                  ? "bg-success"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {movie.status === "now_showing"
                                ? "Đang chiếu"
                                : "Sắp chiếu"}
                            </span>
                          </td>

                          <td>
                            <span className="fw-semibold">
                              {showtimes.length}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-4">
                          {dateFilter ||
                          statusFilter !== "all" ||
                          searchKeyword.trim()
                            ? "Không có lịch chiếu phù hợp với bộ lọc"
                            : "Chưa có phim nào"}
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
            style={{ maxWidth: 860, zIndex: 1050 }}
          >
            <div
              className="card border-0 shadow-lg"
              style={{ borderRadius: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">
                    {modalMode === "create" && "Thêm lịch chiếu"}
                    {modalMode === "edit" && "Cập nhật suất chiếu"}
                    {modalMode === "view" && "Lịch chiếu của phim"}
                  </h4>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={closeModal}
                  >
                    Đóng
                  </button>
                </div>

                {error && (
                  <div className="alert alert-danger py-2">{error}</div>
                )}

                {modalMode === "view" && selectedMovie && (
                  <div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Tên phim</label>
                        <input
                          className="form-control"
                          value={selectedMovie.title}
                          disabled
                          readOnly
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Trạng thái phim</label>
                        <input
                          className="form-control"
                          value={
                            selectedMovie.status === "now_showing"
                              ? "Đang chiếu"
                              : "Sắp chiếu"
                          }
                          disabled
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Danh sách suất chiếu</h6>

                      <button
                        type="button"
                        className="btn btn-sm btn-primary d-inline-flex align-items-center gap-2"
                        onClick={() => openCreateModal(selectedMovie)}
                      >
                        <PlusCircle size={16} />
                        Thêm suất chiếu
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-bordered align-middle admin-table">
                        <thead className="table-light">
                          <tr>
                            <th>Phòng</th>
                            <th>Bắt đầu</th>
                            <th>Kết thúc</th>
                            <th>Trạng thái suất</th>
                            <th style={{ width: 130 }} className="text-center">
                              Thao tác
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedMovieShowtimes.length > 0 ? (
                            selectedMovieShowtimes.map((showtime) => (
                              <tr key={showtime.id}>
                                <td>
                                  {showtime.room_name ||
                                    roomMap.get(showtime.room_id)?.name ||
                                    "N/A"}
                                </td>

                                <td>{formatDateTime(showtime.start_time)}</td>

                                <td>
                                  {getEndTime(
                                    showtime,
                                    selectedMovie.duration_min,
                                  )
                                    ? formatDateTime(
                                        getEndTime(
                                          showtime,
                                          selectedMovie.duration_min,
                                        )?.toISOString(),
                                      )
                                    : "N/A"}
                                </td>

                                <td>
                                  {
                                    getShowtimeStatus(
                                      showtime,
                                      selectedMovie.duration_min,
                                    ).label
                                  }
                                </td>

                                <td
                                  className="text-center"
                                  style={{ width: 130 }}
                                >
                                  <div className="admin-action-group">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary btn-icon"
                                      title="Sửa"
                                      aria-label="Sửa"
                                      onClick={() =>
                                        openEditModal(showtime, selectedMovie)
                                      }
                                    >
                                      <Pencil size={16} />
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger btn-icon"
                                      title="Xóa"
                                      aria-label="Xóa"
                                      onClick={() => handleDelete(showtime.id)}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="text-center text-muted py-4"
                              >
                                Phim này chưa có suất chiếu nào
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(modalMode === "create" || modalMode === "edit") && (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Chọn phim</label>
                        <select
                          className="form-select"
                          value={form.movie_id}
                          onChange={(e) =>
                            handleInputChange(
                              "movie_id",
                              e.target.value ? Number(e.target.value) : "",
                            )
                          }
                        >
                          <option value="">-- Chọn phim --</option>
                          {movies.map((movie) => (
                            <option key={movie.id} value={movie.id}>
                              {movie.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Chọn phòng</label>
                        <select
                          className="form-select"
                          value={form.room_id}
                          onChange={(e) =>
                            handleInputChange(
                              "room_id",
                              e.target.value ? Number(e.target.value) : "",
                            )
                          }
                        >
                          <option value="">-- Chọn phòng --</option>
                          {normalizedRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label">Ngày giờ chiếu</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={form.start_time}
                          onChange={(e) =>
                            handleInputChange("start_time", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                      >
                        {saving
                          ? "Đang lưu..."
                          : modalMode === "edit"
                            ? "Cập nhật suất chiếu"
                            : "Thêm lịch chiếu"}
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

export default function AdminShowtimesPage() {
  return (
    <Suspense
      fallback={<div className="container py-4">Đang tải lịch chiếu...</div>}
    >
      <AdminShowtimesContent />
    </Suspense>
  );
}
