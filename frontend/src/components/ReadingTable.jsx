import Button from "./Button.jsx";
import Card from "./Card.jsx";

const TIME_SLOT_LABELS = {
  morning: "Morning",
  after_breakfast: "After breakfast",
  afternoon: "After lunch",
  evening: "After dinner",
  bedtime: "Bedtime",
};

function formatReadingDate(value) {
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReadingTable({
  actionError,
  actionStatus,
  deletingId,
  readings,
  isLoading,
  error,
  onDelete,
  onEdit,
  onRetry,
  currentPage,
  onPageChange,
  pageCount,
  pageSize,
}) {
  const firstVisibleReading = (currentPage - 1) * pageSize;
  const visibleReadings = readings.slice(firstVisibleReading, firstVisibleReading + pageSize);

  return (
    <Card className="reading-list-card">
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      {actionStatus && <p className="form-message" role="status">{actionStatus}</p>}

      <div className="reading-list-heading">
        <div>
          <p className="eyebrow">Glucose history</p>
          <h2>Readings</h2>
        </div>
        <span className="reading-result-count">
          {readings.length} {readings.length === 1 ? "reading" : "readings"}
        </span>
      </div>

      {isLoading ? (
        <p className="dashboard-message" role="status">Loading readings…</p>
      ) : error ? (
        <div className="reading-list-error" role="alert">
          <p>{error}</p>
          <Button onClick={onRetry} type="button">Try again</Button>
        </div>
      ) : readings.length === 0 ? (
        <div className="empty-readings">
          <p>No readings found.</p>
          <span>Add a reading or adjust the date filter.</span>
        </div>
      ) : (
        <>
          <div className="reading-table-scroll">
            <table className="reading-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Time slot</th>
                  <th scope="col">Glucose</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleReadings.map((reading) => (
                  <tr key={reading.id}>
                    <td>{formatReadingDate(reading.reading_date)}</td>
                    <td>{TIME_SLOT_LABELS[reading.time_slot] || reading.time_slot}</td>
                    <td className="reading-value">{reading.value} <span>mg/dL</span></td>
                    <td>
                      <div className="reading-actions">
                        <Button
                          aria-label={`Edit reading from ${formatReadingDate(reading.reading_date)}`}
                          className="table-action"
                          disabled={deletingId === reading.id}
                          onClick={() => onEdit(reading)}
                          type="button"
                        >
                          Edit
                        </Button>
                        <Button
                          aria-label={`Delete reading from ${formatReadingDate(reading.reading_date)}`}
                          className="table-action"
                          disabled={deletingId === reading.id}
                          onClick={() => onDelete(reading)}
                          type="button"
                        >
                          {deletingId === reading.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <nav className="reading-pagination" aria-label="Reading pages">
              <span className="reading-pagination-summary">
                Showing {firstVisibleReading + 1}-{Math.min(firstVisibleReading + pageSize, readings.length)} of {readings.length}
              </span>
              <div className="reading-pagination-controls">
                <Button
                  className="secondary-button"
                  disabled={currentPage === 1}
                  onClick={() => onPageChange(currentPage - 1)}
                  type="button"
                >
                  Previous
                </Button>
                <span aria-current="page" className="reading-page-indicator">
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  className="secondary-button"
                  disabled={currentPage === pageCount}
                  onClick={() => onPageChange(currentPage + 1)}
                  type="button"
                >
                  Next
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </Card>
  );
}
