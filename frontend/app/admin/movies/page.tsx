"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import { AdminMovie, CreateMoviePayload } from "@/types/admin";
import { adminService } from "@/services/admin";

type ModalMode = "create" | "edit" | "view" | null;
type MovieStatus = "now_showing" | "coming_soon";

const MOVIES_PER_PAGE = 5;
const MAX_POSTER_SIZE_MB = 2;

const initialForm: CreateMoviePayload = {
  title: "",
  genre: "",
  duration_min: 0,
  description: "",
  poster_url: "",
  status: "coming_soon",
  release_date: "",
  director: "",
};

function normalizeText(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function statusText(status?: string) {
  return status === "now_showing" ? "Đang chiếu" : "Sắp chiếu";
}

function statusClass(status?: string) {
  return status === "now_showing" ? "bg-success" : "bg-warning text-dark";
}

function formatDate(value?: string) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("vi-VN");
}

function getBackendOrigin() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000/api";

  // Nếu env là "/api" thì không thể ghép thành "/uploads" được,
  // nên fallback rõ về backend local.
  if (apiUrl === "/api" || apiUrl.endsWith("/api")) {
    if (apiUrl.startsWith("http")) {
      return apiUrl.replace(/\/api\/?$/, "");
    }

    return "http://localhost:5000";
  }

  return apiUrl.replace(/\/api\/?$/, "");
}

function getPosterSrc(src?: string) {
  if (!src) return "";

  const value = src.trim();

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/uploads")) {
    return `${getBackendOrigin()}${value}`;
  }

  if (value.startsWith("/images")) {
    return value;
  }

  if (value.startsWith("images/")) {
    return `/${value}`;
  }

  return value;
}

function PosterImage({
  src,
  alt,
  height = 180,
}: {
  src?: string;
  alt: string;
  height?: number;
}) {
  const safeSrc = getPosterSrc(src);

  return (
    <div
      className="rounded border bg-light d-flex align-items-center justify-content-center overflow-hidden"
      style={{
        width: "100%",
        height,
        minHeight: height,
      }}
    >
      {safeSrc ? (
        <img
          src={safeSrc}
          alt={alt}
          className="w-100 h-100"
          style={{
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            console.error("Poster load failed:", safeSrc);
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span className="text-muted small">Chưa có poster</span>
      )}
    </div>
  );
}

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedMovie, setSelectedMovie] = useState<AdminMovie | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateMoviePayload>(initialForm);

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MovieStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);

  async function fetchMovies() {
    try {
      setLoading(true);
      setError("");

      const data = await adminService.getMovies();
      setMovies(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách phim",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMovies();
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

  const filteredMovies = useMemo(() => {
    const keyword = normalizeText(searchTerm);

    return movies.filter((movie) => {
      const matchSearch =
        !keyword ||
        normalizeText(movie.title).includes(keyword) ||
        normalizeText(movie.genre).includes(keyword) ||
        normalizeText(movie.director).includes(keyword);

      const matchStatus =
        statusFilter === "all" || movie.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [movies, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMovies.length / MOVIES_PER_PAGE),
  );

  const paginatedMovies = useMemo(() => {
    const start = (currentPage - 1) * MOVIES_PER_PAGE;
    return filteredMovies.slice(start, start + MOVIES_PER_PAGE);
  }, [filteredMovies, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function fillFormFromMovie(movie: AdminMovie) {
    setForm({
      title: movie.title || "",
      genre: movie.genre || "",
      duration_min: Number(movie.duration_min || 0),
      description: movie.description || "",
      poster_url: movie.poster_url || "",
      status: (movie.status as MovieStatus) || "coming_soon",
      release_date: movie.release_date
        ? new Date(movie.release_date).toISOString().split("T")[0]
        : "",
      director: movie.director || "",
    });

    setPosterFile(null);
    setPosterPreview("");
  }

  function handleInputChange(
    key: keyof CreateMoviePayload,
    value: string | number,
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function closeModal() {
    if (posterPreview.startsWith("blob:")) {
      URL.revokeObjectURL(posterPreview);
    }

    setModalMode(null);
    setSelectedMovie(null);
    setEditingId(null);
    setForm(initialForm);
    setPosterFile(null);
    setPosterPreview("");
    setError("");
  }

  function openCreateModal() {
    setForm(initialForm);
    setPosterFile(null);
    setPosterPreview("");
    setSelectedMovie(null);
    setEditingId(null);
    setModalMode("create");
    setError("");
  }

  function openViewModal(movie: AdminMovie) {
    setSelectedMovie(movie);
    setModalMode("view");
    setError("");
  }

  function openEditModal(movie: AdminMovie) {
    fillFormFromMovie(movie);
    setSelectedMovie(movie);
    setEditingId(movie.id);
    setModalMode("edit");
    setError("");
  }

  function checkDuplicateTitle() {
    const currentTitle = normalizeText(form.title);

    return movies.some((movie) => {
      const sameTitle = normalizeText(movie.title) === currentTitle;
      const isSameMovie = editingId && movie.id === editingId;

      return sameTitle && !isSameMovie;
    });
  }

  function validateForm() {
    const title = form.title.trim();
    const genre = form.genre.trim();
    const director = (form.director || "").trim();

    if (!title) {
      return "Vui lòng nhập tên phim";
    }

    if (!genre) {
      return "Vui lòng nhập thể loại phim";
    }

    if (!director) {
      return "Vui lòng nhập đạo diễn";
    }

    if (!form.release_date) {
      return "Vui lòng chọn ngày chiếu";
    }

    if (Number(form.duration_min) <= 0) {
      return "Thời lượng phim phải lớn hơn 0";
    }

    if (modalMode === "create" && !posterFile) {
      return "Vui lòng tải ảnh poster từ máy";
    }

    if (modalMode === "edit" && !posterFile && !form.poster_url) {
      return "Vui lòng tải ảnh poster từ máy";
    }

    if (checkDuplicateTitle()) {
      return "Tên phim đã tồn tại, vui lòng nhập tên phim khác";
    }

    return "";
  }

  function handlePosterUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn đúng file hình ảnh");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_POSTER_SIZE_MB * 1024 * 1024) {
      setError(`Ảnh poster không được vượt quá ${MAX_POSTER_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }

    if (posterPreview.startsWith("blob:")) {
      URL.revokeObjectURL(posterPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setPosterFile(file);
    setPosterPreview(previewUrl);
    setError("");
  }

  function clearPoster() {
    if (posterPreview.startsWith("blob:")) {
      URL.revokeObjectURL(posterPreview);
    }

    setPosterFile(null);
    setPosterPreview("");
    handleInputChange("poster_url", "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = new FormData();

      payload.append("title", form.title.trim());
      payload.append("genre", form.genre.trim());
      payload.append("director", (form.director || "").trim());
      payload.append("description", (form.description || "").trim());
      payload.append("duration_min", String(Number(form.duration_min)));
      payload.append("release_date", form.release_date || "");
      payload.append("status", form.status || "coming_soon");
      payload.append("poster_url", form.poster_url || "");

      if (posterFile) {
        payload.append("poster", posterFile);
      }

      if (modalMode === "edit" && editingId) {
        await adminService.updateMovie(editingId, payload);
      } else {
        await adminService.createMovie(payload);
      }

      await fetchMovies();
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lưu phim thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(movie: AdminMovie) {
    if (movie.status === "now_showing") {
      setError("Phim đang chiếu không thể xóa");
      return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn xóa phim này?");
    if (!confirmed) return;

    try {
      setError("");
      await adminService.deleteMovie(movie.id);
      await fetchMovies();

      if (selectedMovie?.id === movie.id) {
        closeModal();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xóa phim thất bại");
    }
  }

  return (
    <>
      <div className="admin-page">
        <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Quản lý phim</h2>
            <p className="text-muted mb-0">
              Quản lý danh sách phim trong hệ thống CineGo
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            + Thêm phim
          </button>
        </div>

        {error && !modalMode && (
          <div className="alert alert-danger">{error}</div>
        )}

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-lg-8">
                <label className="form-label fw-semibold">Tìm kiếm phim</label>
                <div className="position-relative">
                  <Search
                    size={18}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                  />
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Tìm theo tên phim, thể loại hoặc đạo diễn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-lg-3">
                <label className="form-label fw-semibold">Lọc trạng thái</label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "all" | MovieStatus)
                  }
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="now_showing">Đang chiếu</option>
                  <option value="coming_soon">Sắp chiếu</option>
                </select>
              </div>

              <div className="col-lg-1">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  title="Xóa bộ lọc"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="alert alert-secondary">Đang tải dữ liệu...</div>
        ) : (
          <div className="card border-0 shadow-sm admin-table-card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 admin-table">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 110 }}>Poster</th>
                      <th>Tên phim</th>
                      <th>Thể loại</th>
                      <th style={{ width: 130 }}>Ngày chiếu</th>
                      <th style={{ width: 140 }}>Trạng thái</th>
                      <th style={{ width: 150 }} className="text-center">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedMovies.length > 0 ? (
                      paginatedMovies.map((movie) => (
                        <tr key={movie.id}>
                          <td>
                            <div style={{ width: 72 }}>
                              <PosterImage
                                src={movie.poster_url}
                                alt={movie.title}
                                height={96}
                              />
                            </div>
                          </td>

                          <td>
                            <div className="admin-table-title fw-semibold">
                              {movie.title}
                            </div>
                            <div className="small text-muted">
                              Đạo diễn: {movie.director || "N/A"}
                            </div>
                          </td>

                          <td>{movie.genre || "N/A"}</td>

                          <td>{formatDate(movie.release_date)}</td>

                          <td>
                            <span
                              className={`badge rounded-pill px-3 py-2 ${statusClass(
                                movie.status,
                              )}`}
                            >
                              {statusText(movie.status)}
                            </span>
                          </td>

                          <td className="text-center">
                            <div className="admin-action-group">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info btn-icon"
                                title="Xem"
                                aria-label="Xem"
                                onClick={() => openViewModal(movie)}
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary btn-icon"
                                title="Sửa"
                                aria-label="Sửa"
                                onClick={() => openEditModal(movie)}
                              >
                                <Pencil size={16} />
                              </button>

                              {movie.status !== "now_showing" && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger btn-icon"
                                  title="Xóa"
                                  aria-label="Xóa"
                                  onClick={() => handleDelete(movie)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          Không có phim phù hợp
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredMovies.length > 0 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 px-3 py-3 border-top bg-light">
                  <div className="text-muted small">
                    Hiển thị{" "}
                    <strong>{(currentPage - 1) * MOVIES_PER_PAGE + 1}</strong> -{" "}
                    <strong>
                      {Math.min(
                        currentPage * MOVIES_PER_PAGE,
                        filteredMovies.length,
                      )}
                    </strong>{" "}
                    trong tổng <strong>{filteredMovies.length}</strong> phim
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                      Trước
                    </button>

                    <span className="small fw-semibold">
                      Trang {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
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
            className="position-fixed top-50 start-50 translate-middle w-100 px-3 modal-custom"
            style={{
              maxWidth: 900,
              maxHeight: "90vh",
              zIndex: 1050,
            }}
          >
            <div
              className="card border-0 shadow-lg"
              onClick={(e) => e.stopPropagation()}
              style={{
                borderRadius: 16,
                overflow: "hidden",
                maxHeight: "90vh",
              }}
            >
              <div
                className="card-body p-4"
                style={{
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <h4 className="mb-1">
                      {modalMode === "create" && "Thêm phim"}
                      {modalMode === "edit" && "Cập nhật phim"}
                      {modalMode === "view" && "Chi tiết phim"}
                    </h4>

                    {selectedMovie && (
                      <p className="text-muted small mb-0">
                        ID phim: #{selectedMovie.id}
                      </p>
                    )}
                  </div>

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
                  <div className="row g-4">
                    <div className="col-md-4">
                      <PosterImage
                        src={selectedMovie.poster_url}
                        alt={selectedMovie.title}
                        height={320}
                      />
                    </div>

                    <div className="col-md-8">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Tên phim</label>
                          <input
                            className="form-control form-control-sm"
                            value={selectedMovie.title || ""}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Đạo diễn</label>
                          <input
                            className="form-control form-control-sm"
                            value={selectedMovie.director || "Chưa cập nhật"}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Thể loại</label>
                          <input
                            className="form-control form-control-sm"
                            value={selectedMovie.genre || ""}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Thời lượng</label>
                          <input
                            className="form-control form-control-sm"
                            value={`${selectedMovie.duration_min || 0} phút`}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Ngày chiếu</label>
                          <input
                            className="form-control form-control-sm"
                            value={formatDate(selectedMovie.release_date)}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Trạng thái</label>
                          <input
                            className="form-control form-control-sm"
                            value={statusText(selectedMovie.status)}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label">Mô tả</label>
                          <textarea
                            className="form-control form-control-sm"
                            rows={5}
                            value={selectedMovie.description || ""}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mt-4">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => openEditModal(selectedMovie)}
                        >
                          Chuyển sang sửa
                        </button>

                        {selectedMovie.status !== "now_showing" && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(selectedMovie)}
                          >
                            Xóa phim
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(modalMode === "create" || modalMode === "edit") && (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                      <div className="col-md-4">
                        <label className="form-label fw-semibold mb-2">
                          Poster phim
                        </label>

                        <PosterImage
                          src={posterPreview || form.poster_url}
                          alt={form.title || "Poster preview"}
                          height={320}
                        />

                        <label className="btn btn-outline-primary w-100 mt-3 d-flex align-items-center justify-content-center gap-2">
                          <Upload size={18} />
                          Tải ảnh từ máy
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handlePosterUpload}
                          />
                        </label>

                        {(posterPreview || form.poster_url) && (
                          <button
                            type="button"
                            className="btn btn-outline-danger w-100 mt-2"
                            onClick={clearPoster}
                          >
                            Xóa ảnh
                          </button>
                        )}

                        <div className="form-text">
                          Chọn file ảnh từ laptop, tối đa {MAX_POSTER_SIZE_MB}
                          MB.
                        </div>
                      </div>

                      <div className="col-md-8">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Tên phim</label>
                            <input
                              className="form-control form-control-sm"
                              value={form.title}
                              onChange={(e) =>
                                handleInputChange("title", e.target.value)
                              }
                              placeholder="Nhập tên phim"
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">Đạo diễn</label>
                            <input
                              className="form-control form-control-sm"
                              value={form.director || ""}
                              onChange={(e) =>
                                handleInputChange("director", e.target.value)
                              }
                              placeholder="Nhập tên đạo diễn"
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">Thể loại</label>
                            <input
                              className="form-control form-control-sm"
                              value={form.genre}
                              onChange={(e) =>
                                handleInputChange("genre", e.target.value)
                              }
                              placeholder="Nhập thể loại"
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">Thời lượng</label>
                            <input
                              type="number"
                              min={1}
                              className="form-control form-control-sm"
                              value={form.duration_min || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "duration_min",
                                  Number(e.target.value),
                                )
                              }
                              placeholder="Nhập số phút"
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">Ngày chiếu</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={form.release_date}
                              onChange={(e) =>
                                handleInputChange(
                                  "release_date",
                                  e.target.value,
                                )
                              }
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">Trạng thái</label>
                            <select
                              className="form-select form-select-sm"
                              value={form.status}
                              onChange={(e) =>
                                handleInputChange(
                                  "status",
                                  e.target.value as MovieStatus,
                                )
                              }
                            >
                              <option value="coming_soon">Sắp chiếu</option>
                              <option value="now_showing">Đang chiếu</option>
                            </select>
                          </div>

                          <div className="col-12">
                            <label className="form-label">Mô tả</label>
                            <textarea
                              className="form-control form-control-sm"
                              rows={5}
                              value={form.description}
                              onChange={(e) =>
                                handleInputChange("description", e.target.value)
                              }
                              placeholder="Nhập mô tả phim"
                            />
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2 mt-4">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                          >
                            {saving
                              ? "Đang lưu..."
                              : modalMode === "edit"
                                ? "Cập nhật phim"
                                : "Thêm phim"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={closeModal}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
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
