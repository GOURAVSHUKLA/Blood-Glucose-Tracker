import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeSlot(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Dashboard() {
  const navigate = useNavigate();
  const today = useMemo(() => getLocalDateValue(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadReadings() {
      setIsLoading(true);
      setError("");
      try {
        const result = await apiRequest("/readings");
        if (!Array.isArray(result)) {
          throw new Error("The API returned an unexpected readings response.");
        }
        if (isMounted) {
          setReadings(result);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || "Unable to load your readings.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReadings();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const selectedReadings = useMemo(
    () => readings.filter((reading) => String(reading.reading_date).slice(0, 10) === selectedDate),
    [readings, selectedDate],
  );
  const values = selectedReadings.map((reading) => Number(reading.value));
  const hasReadings = values.length > 0;
  const highest = hasReadings ? Math.max(...values) : "—";
  const lowest = hasReadings ? Math.min(...values) : "—";
  const average = hasReadings
    ? (values.reduce((total, value) => total + value, 0) / values.length).toFixed(1)
    : "—";
  const visibleReadings = readings.slice(0, 5);
  const statsReady = !isLoading && !error;

  return (
    <div className="dashboard-page">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Daily glucose snapshot</p>
          <h2>{selectedDate === today ? "Today’s overview" : `Overview for ${formatReadingDate(selectedDate)}`}</h2>
          <p className="dashboard-description">
            Review your readings and see how your selected day is trending.
          </p>
        </div>
        <div className="dashboard-actions">
          <label className="date-picker">
            <span>Choose date</span>
            <input
              max={today}
              onChange={(event) => setSelectedDate(event.target.value || today)}
              type="date"
              value={selectedDate}
            />
          </label>
          <Button onClick={() => navigate("/readings#reading-form")} type="button">
            Quick Add Reading
          </Button>
        </div>
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          <p>{error}</p>
          <Button onClick={() => setReloadKey((key) => key + 1)} type="button">
            Try again
          </Button>
        </div>
      )}

      <section className="stats-grid" aria-label="Glucose statistics">
        <StatCard
          label="Readings"
          value={statsReady ? selectedReadings.length : "—"}
          unit={statsReady ? "for selected date" : ""}
        />
        <StatCard
          label="Highest glucose"
          value={statsReady ? highest : "—"}
          unit={statsReady && hasReadings ? "mg/dL" : ""}
        />
        <StatCard
          label="Lowest glucose"
          value={statsReady ? lowest : "—"}
          unit={statsReady && hasReadings ? "mg/dL" : ""}
        />
        <StatCard
          label="Average glucose"
          value={statsReady ? average : "—"}
          unit={statsReady && hasReadings ? "mg/dL" : ""}
        />
      </section>

      <section className="recent-panel" aria-labelledby="recent-readings-title">
        <div className="recent-panel-heading">
          <div>
            <p className="eyebrow">Your log</p>
            <h2 id="recent-readings-title">Recent readings</h2>
          </div>
          <Button className="secondary-button" onClick={() => navigate("/readings")} type="button">
            View all
          </Button>
        </div>

        {isLoading ? (
          <p className="dashboard-message" role="status">Loading your readings…</p>
        ) : error ? (
          <p className="dashboard-message">Readings could not be loaded.</p>
        ) : visibleReadings.length === 0 ? (
          <div className="empty-readings">
            <p>No readings yet.</p>
            <span>Add your first reading to start tracking your glucose.</span>
          </div>
        ) : (
          <ul className="recent-reading-list">
            {visibleReadings.map((reading) => (
              <li className="recent-reading" key={reading.id}>
                <div>
                  <span className="recent-reading-slot">{formatTimeSlot(reading.time_slot)}</span>
                  <span className="recent-reading-date">{formatReadingDate(reading.reading_date)}</span>
                </div>
                <strong>{reading.value} <span>mg/dL</span></strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
