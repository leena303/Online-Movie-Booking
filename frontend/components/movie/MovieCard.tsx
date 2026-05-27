"use client";

import { Movie } from "@/types/movie";
import { useRouter } from "next/navigation";

interface MovieCardProps {
  movie: Movie;
  isDimmed?: boolean;
  isHidden?: boolean;
  onBook: (movie: Movie) => void;
}

function getBackendOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

function getPosterSrc(posterUrl?: string) {
  if (!posterUrl || !posterUrl.trim()) {
    return "/images/movie-placeholder.jpg";
  }

  const value = posterUrl.trim();

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

  return `/images/${value}`;
}

export default function MovieCard({
  movie,
  isDimmed = false,
  isHidden = false,
  onBook,
}: MovieCardProps) {
  const router = useRouter();
  const posterSrc = getPosterSrc(movie.poster_url);

  return (
    <div
      className="card border-0 shadow-sm h-100"
      style={{
        opacity: isHidden ? 0 : isDimmed ? 0.25 : 1,
        pointerEvents: isHidden ? "none" : "auto",
        transform: isHidden ? "scale(0.98)" : "scale(1)",
        transition: "all 0.25s ease",
        visibility: isHidden ? "hidden" : "visible",
      }}
    >
      <div className="position-relative" style={{ height: 320 }}>
        <img
          src={posterSrc}
          alt={movie.title}
          className="w-100 h-100 rounded-top"
          style={{ objectFit: "cover" }}
        />

        <span
          className={`badge position-absolute top-0 start-0 m-2 ${
            movie.status === "now_showing"
              ? "bg-danger"
              : "bg-warning text-dark"
          }`}
        >
          {movie.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu"}
        </span>
      </div>

      <div className="card-body d-flex flex-column">
        <h5 className="card-title" style={{ minHeight: 48 }}>
          {movie.title}
        </h5>

        <p className="mb-1 small text-muted">
          <strong>Đạo diễn:</strong> {movie.director || "Chưa cập nhật"}
        </p>

        <p className="mb-1 small text-muted">
          <strong>Thể loại:</strong> {movie.genre}
        </p>

        <p className="mb-3 small text-muted">
          <strong>Thời lượng:</strong> {movie.duration_min} phút
        </p>

        <div className="d-flex gap-2 mt-auto">
          <button
            type="button"
            className="btn btn-outline-danger btn-sm w-100"
            onClick={() => router.push(`/movies/${movie.id}`)}
          >
            Chi tiết
          </button>

          <button
            type="button"
            className="btn btn-danger btn-sm w-100"
            onClick={() => onBook(movie)}
            disabled={movie.status !== "now_showing"}
          >
            Đặt vé
          </button>
        </div>
      </div>
    </div>
  );
}
