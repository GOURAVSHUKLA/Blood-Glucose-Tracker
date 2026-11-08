import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import StatCard from "../components/StatCard.jsx";
import { apiRequest } from "../services/api.js";

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReadingDate(value) {
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeSlot(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Reports() {
  const today = useMemo(() => getLocalDateValue(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadReport() {
      setIsLoading(true);
      setError("");

      try {
        const result = await apiRequest("/reports", {
          params: { date: selectedDate },
        });
        if (
          result?.date !== selectedDate ||
          !Number.isInteger(result.totalReadings) ||
          !Array.isArray(result.readings) ||
          result?.monthToDate?.startDate !== `${selectedDate.slice(0, 7)}-01` ||
          result.monthToDate.endDate !== selectedDate ||
          !Number.isInteger(result.monthToDate.totalReadings)
        ) {
          throw new Error("The API returned an unexpected daily report response.");
        }
        if (isMounted) {
          setReport(result);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || "Unable to load the daily report.");
          setReport(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReport();
    return () => {
      isMounted = false;
    };
  }, [reloadKey, selectedDate]);

  const hasReadings = report?.totalReadings > 0;
  const monthHasReadings = report?.monthToDate.totalReadings > 0;
  const reportReady = !isLoading && !error && report;

  return (
    <div className="dashboard-page">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Your glucose trends</p>
          <h2>Month-to-date report</h2>
          <p className="dashboard-description">
            From the first day of the month through the selected date.
          </p>
        </div>
        <label className="date-picker">
          <span>Choose date</span>
          <input
            max={today}
            onChange={(event) => setSelectedDate(event.target.value || today)}
            type="date"
            value={selectedDate}
          />
        </label>
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          <p>{error}</p>
          <Button onClick={() => setReloadKey((key) => key + 1)} type="button">
            Try again
          </Button>
        </div>
      )}

      <Card className="report-readings-card">
        <div className="recent-panel-heading">
          <div>
            <p className="eyebrow">Month-to-date range</p>
            <h2>
              {reportReady
                ? `${formatReadingDate(report.monthToDate.startDate)} – ${formatReadingDate(report.monthToDate.endDate)}`
                : `${formatReadingDate(`${selectedDate.slice(0, 7)}-01`)} – ${formatReadingDate(selectedDate)}`}
            </h2>
          </div>
          {reportReady && (
            <span className="reading-result-count">
              {report.monthToDate.totalReadings} {report.monthToDate.totalReadings === 1 ? "reading" : "readings"}
            </span>
          )}
        </div>

        <section className="stats-grid report-stats-grid" aria-label="Month-to-date glucose statistics">
          <StatCard
            label="Total readings"
            value={reportReady ? report.monthToDate.totalReadings : "—"}
            unit={reportReady ? "month to date" : ""}
          />
          <StatCard
            label="Highest reading"
            value={reportReady && monthHasReadings ? report.monthToDate.maxValue : "—"}
            unit={reportReady && monthHasReadings ? "mg/dL" : ""}
          />
          <StatCard
            label="Lowest reading"
            value={reportReady && monthHasReadings ? report.monthToDate.minValue : "—"}
            unit={reportReady && monthHasReadings ? "mg/dL" : ""}
          />
          <StatCard
            label="Average reading"
            value={reportReady && monthHasReadings
              ? Number(report.monthToDate.averageValue).toFixed(2)
              : "—"}
            unit={reportReady && monthHasReadings ? "mg/dL" : ""}
          />
        </section>

        {reportReady && !monthHasReadings && (
          <div className="empty-readings">
            <p>No readings for this date range.</p>
            <span>Choose another date or add a reading to see your month-to-date report.</span>
          </div>
        )}
      </Card>

      <section className="stats-grid" aria-label="Selected-day glucose report">
        <StatCard
          label="Number of readings"
          value={reportReady ? report.totalReadings : "—"}
          unit={reportReady ? "for selected date" : ""}
        />
        <StatCard
          label="Highest reading"
          value={reportReady && hasReadings ? report.maxValue : "—"}
          unit={reportReady && hasReadings ? "mg/dL" : ""}
        />
        <StatCard
          label="Lowest reading"
          value={reportReady && hasReadings ? report.minValue : "—"}
          unit={reportReady && hasReadings ? "mg/dL" : ""}
        />
        <StatCard
          label="Average reading"
          value={reportReady && hasReadings ? Number(report.averageValue).toFixed(2) : "—"}
          unit={reportReady && hasReadings ? "mg/dL" : ""}
        />
      </section>

      <Card className="report-readings-card">
        <div className="recent-panel-heading">
          <div>
            <p className="eyebrow">Selected date</p>
            <h2>{formatReadingDate(selectedDate)}</h2>
          </div>
          {reportReady && (
            <span className="reading-result-count">
              {report.totalReadings} {report.totalReadings === 1 ? "reading" : "readings"}
            </span>
          )}
        </div>

        {isLoading ? (
          <p className="dashboard-message" role="status">Loading daily report…</p>
        ) : error ? (
          <p className="dashboard-message">The report could not be loaded.</p>
        ) : report.readings.length === 0 ? (
          <div className="empty-readings">
            <p>No readings for this date.</p>
            <span>Choose another date or add a reading to see its daily report.</span>
          </div>
        ) : (
          <div className="reading-table-scroll">
            <table className="reading-table">
              <thead>
                <tr>
                  <th scope="col">Time slot</th>
                  <th scope="col">Glucose</th>
                </tr>
              </thead>
              <tbody>
                {report.readings.map((reading) => (
                  <tr key={reading.id}>
                    <td>{formatTimeSlot(reading.time_slot)}</td>
                    <td className="reading-value">{reading.value} <span>mg/dL</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
