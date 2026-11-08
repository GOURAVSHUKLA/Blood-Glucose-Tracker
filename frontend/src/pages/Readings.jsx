import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/Button.jsx";
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
  const [editingReading, setEditingReading] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const readingFormRef = useRef(null);

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

  useEffect(() => {
    if (editingReading) {
      readingFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingReading]);

  useEffect(() => {
    if (window.location.hash === "#reading-form") {
      readingFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const filteredReadings = useMemo(
    () => filterDate
      ? readings.filter((reading) => String(reading.reading_date).slice(0, 10) === filterDate)
      : readings,
    [filterDate, readings],
  );

  function handleReadingCreated(reading) {
    setReadings((currentReadings) => sortReadings([...currentReadings, reading]));
  }

  function handleReadingUpdated(reading, message) {
    setReadings((currentReadings) => sortReadings(
      currentReadings.map((currentReading) => (
        currentReading.id === reading.id ? reading : currentReading
      )),
    ));
    setEditingReading(null);
    setActionError("");
    setActionStatus(message);
  }

  async function handleReadingDeleted(reading) {
    const confirmed = window.confirm(
      `Delete the ${reading.value} mg/dL reading from ${String(reading.reading_date).slice(0, 10)}? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(reading.id);
    setActionError("");
    setActionStatus("");
    try {
      const result = await apiRequest(`/readings/${encodeURIComponent(reading.id)}`, {
        method: "DELETE",
      });
      if (!result?.message) {
        throw new Error("The server did not confirm that the reading was deleted.");
      }

      setReadings((currentReadings) => currentReadings.filter(
        (currentReading) => currentReading.id !== reading.id,
      ));
      setEditingReading((currentReading) => (
        currentReading?.id === reading.id ? null : currentReading
      ));
      setActionStatus(result.message);
    } catch (requestError) {
      setActionError(requestError.message || "Unable to delete this reading. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="readings-page">
      <section className="readings-page-heading">
        <div>
          <p className="eyebrow">Glucose history</p>
          <h2>Manage your readings</h2>
          <p>Review and filter the readings you have recorded.</p>
        </div>
        <div className="readings-heading-actions">
          <label className="date-picker">
            <span>Filter by date</span>
            <input
              onChange={(event) => setFilterDate(event.target.value)}
              type="date"
              value={filterDate}
            />
          </label>
          <Button
            className="secondary-button"
            onClick={() => readingFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            type="button"
          >
            Add reading
          </Button>
        </div>
      </section>

      <ReadingTable
        actionError={actionError}
        actionStatus={actionStatus}
        deletingId={deletingId}
        error={error}
        isLoading={isLoading}
        onDelete={handleReadingDeleted}
        onEdit={(reading) => {
          setActionError("");
          setActionStatus("");
          setEditingReading(reading);
        }}
        onRetry={() => setReloadKey((key) => key + 1)}
        readings={filteredReadings}
      />

      <div id="reading-form" ref={readingFormRef}>
        <ReadingForm
          editingReading={editingReading}
          isLoadingReadings={isLoading}
          loadError={error}
          onCancelEdit={() => setEditingReading(null)}
          onReadingCreated={handleReadingCreated}
          onReadingUpdated={handleReadingUpdated}
          readings={readings}
        />
      </div>
    </div>
  );
}
