import { moviesService } from "@/services/movies";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDateTime(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ShowtimesPage({ params }: Props) {
  const { id } = await params;
  const showtimes = await moviesService.getShowtimesByMovieId(id);

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="fw-bold fs-3 mb-0">Danh sách suất chiếu</h1>
      </div>

      {showtimes.length === 0 ? (
        <div className="alert alert-secondary mb-0">
          Hiện chưa có suất chiếu còn hiệu lực cho phim này.
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {showtimes.map((item) => (
            <div key={item.id} className="card border-0 shadow-sm">
              <div className="card-body">
                <p className="mb-2">
                  <span className="fw-semibold">Phòng:</span>{" "}
                  {item.room_name || "Chưa cập nhật"}
                </p>

                <p className="mb-2">
                  <span className="fw-semibold">Giờ chiếu:</span>{" "}
                  {formatDateTime(item.start_time)}
                </p>

                <p className="mb-0">
                  <span className="fw-semibold">Giá:</span>{" "}
                  {Number(item.price || 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
