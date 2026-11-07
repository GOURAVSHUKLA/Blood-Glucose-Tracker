import { useEffect, useMemo, useState } from "react";
import ReadingForm from "../components/ReadingForm.jsx";
import ReadingTable from "../components/ReadingTable.jsx";
import { apiRequest } from "../services/api.js";

function sortReadings(readings) {
  return [...readings].sort((first, second) => {
    const dateOrder = String(second.reading_date)
      .slice(0, 10)
      .localeCompare(String(first.reading_date).slice(0, 10));
    if (dateOrder !== 0) {
      return dateOrder;
    }
    return String(second.created_at || "").localeCompare(String(first.created_at || ""));
  });
}

export default function Readings() {
  const [readings, setReadings] = useState([]);
  const [filterDate, setFilterDate] = useState("");
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
          setReadings(sortReadings(result));
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || "Unable to load readings.");
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

  const filteredReadings = useMemo(
    () => filterDate
      ? readings.filter((reading) => String(reading.reading_date).slice(0, 10) === filterDate)
      : readings,
    [filterDate, readings],
  );

  function handleReadingCreated(reading) {
    setReadings((currentReadings) => sortReadings([...currentReadings, reading]));
  }

  return (
    <div className="readings-page">
      <section className="readings-page-heading">
        <div>
          <p className="eyebrow">Glucose history</p>
          <h2>Manage your readings</h2>
          <p>Review and filter the readings you have recorded.</p>
        </div>
        <label className="date-picker">
          <span>Filter by date</span>
          <input
            onChange={(event) => setFilterDate(event.target.value)}
            type="date"
            value={filterDate}
          />
        </label>
      </section>

      <ReadingTable
        error={error}
        isLoading={isLoading}
        onRetry={() => setReloadKey((key) => key + 1)}
        readings={filteredReadings}
      />

      <ReadingForm
        isLoadingReadings={isLoading}
        loadError={error}
        onReadingCreated={handleReadingCreated}
        readings={readings}
      />
    </div>
  );
}
