import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import StatCard from "../components/StatCard.jsx";
import { apiRequest } from "../services/api.js";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

function formatChartDate(value) {
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getPreviousMonthRange(date) {
  const [year, month] = date.slice(0, 7).split("-").map(Number);
  return {
    startDate: new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10),
    endDate: new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10),
  };
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
          !Number.isInteger(result.monthToDate.totalReadings) ||
          !Array.isArray(result.monthToDate.dailyReadings) ||
          !result.previousMonth?.startDate ||
          !result.previousMonth?.endDate ||
          !Number.isInteger(result.previousMonth.totalReadings)
        ) {
          throw new Error("The API returned an unexpected report response.");
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
  const previousMonthHasReadings = report?.previousMonth.totalReadings > 0;
  const reportReady = !isLoading && !error && report;
  const monthlyChartData = reportReady ? report.monthToDate.dailyReadings : [];
  const dailyChartData = reportReady
    ? report.readings.map((reading) => ({
        slot: formatTimeSlot(reading.time_slot),
        value: Number(reading.value),
      }))
    : [];
  const readingTrendData = monthlyChartData.map((day) => ({
    ...day,
    chartDate: formatChartDate(day.date),
  }));
  const monthlyGlucoseData = monthlyChartData.map((day) => ({
    ...day,
    chartDate: formatChartDate(day.date),
  }));
  const previousMonthRange = reportReady
    ? report.previousMonth
    : getPreviousMonthRange(selectedDate);

  return (
    <div className="dashboard-page">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Your glucose trends</p>
          <h2>Glucose reports</h2>
          <p className="dashboard-description">
            Previous-month and month-to-date statistics for the selected date.
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
            <p className="eyebrow">Previous full month</p>
            <h2>
              {`${formatReadingDate(previousMonthRange.startDate)} – ${formatReadingDate(previousMonthRange.endDate)}`}
            </h2>
          </div>
          {reportReady && (
            <span className="reading-result-count">
              {report.previousMonth.totalReadings} {report.previousMonth.totalReadings === 1 ? "reading" : "readings"}
            </span>
          )}
        </div>

        <section className="stats-grid report-stats-grid" aria-label="Previous month glucose statistics">
          <StatCard
            label="Total readings"
            value={reportReady ? report.previousMonth.totalReadings : "—"}
            unit={reportReady ? "previous month" : ""}
          />
          <StatCard
            label="Highest reading"
            value={reportReady && previousMonthHasReadings ? report.previousMonth.maxValue : "—"}
            unit={reportReady && previousMonthHasReadings ? "mg/dL" : ""}
          />
          <StatCard
            label="Lowest reading"
            value={reportReady && previousMonthHasReadings ? report.previousMonth.minValue : "—"}
            unit={reportReady && previousMonthHasReadings ? "mg/dL" : ""}
          />
          <StatCard
            label="Average reading"
            value={reportReady && previousMonthHasReadings
              ? Number(report.previousMonth.averageValue).toFixed(2)
              : "—"}
            unit={reportReady && previousMonthHasReadings ? "mg/dL" : ""}
          />
        </section>

        {reportReady && !previousMonthHasReadings && (
          <div className="empty-readings">
            <p>No readings for the previous month.</p>
            <span>Choose another date to view a different month’s report.</span>
          </div>
        )}
      </Card>

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

      <section className="report-charts" aria-label="Glucose charts">
        <Card className="report-chart-card report-chart-card-wide">
          <div className="report-chart-heading">
            <h2>Monthly glucose</h2>
            <p>Daily average, high, and low through the selected date (mg/dL).</p>
          </div>
          {isLoading ? (
            <p className="dashboard-message" role="status">Loading chart data…</p>
          ) : error ? (
            <p className="dashboard-message">Chart data could not be loaded.</p>
          ) : !monthHasReadings ? (
            <div className="empty-readings">
              <p>No glucose values to chart this month.</p>
              <span>Recorded readings will appear here.</span>
            </div>
          ) : (
            <div className="report-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGlucoseData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="#e8eaf2" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="chartDate"
                    interval="preserveStartEnd"
                    minTickGap={18}
                    tick={{ fill: "#777f91", fontSize: 12 }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: "#777f91", fontSize: 12 }}
                    width={48}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    connectNulls={false}
                    dataKey="averageValue"
                    name="Average"
                    stroke="#5b52c8"
                    strokeWidth={2.5}
                    type="monotone"
                  />
                  <Line
                    connectNulls={false}
                    dataKey="maxValue"
                    name="Highest"
                    stroke="#e27655"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Line
                    connectNulls={false}
                    dataKey="minValue"
                    name="Lowest"
                    stroke="#42a899"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="report-chart-card">
          <div className="report-chart-heading">
            <h2>Selected-day glucose</h2>
            <p>Compare readings across time slots (mg/dL).</p>
          </div>
          {isLoading ? (
            <p className="dashboard-message" role="status">Loading chart data…</p>
          ) : error ? (
            <p className="dashboard-message">Chart data could not be loaded.</p>
          ) : dailyChartData.length === 0 ? (
            <div className="empty-readings">
              <p>No readings for this date.</p>
              <span>Choose another date to see its glucose values.</span>
            </div>
          ) : (
            <div className="report-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="#e8eaf2" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="slot"
                    interval={0}
                    tick={{ fill: "#777f91", fontSize: 11 }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: "#777f91", fontSize: 12 }}
                    width={48}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#5b52c8" name="Glucose" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="report-chart-card">
          <div className="report-chart-heading">
            <h2>Reading trend</h2>
            <p>Number of readings recorded each day this month.</p>
          </div>
          {isLoading ? (
            <p className="dashboard-message" role="status">Loading chart data…</p>
          ) : error ? (
            <p className="dashboard-message">Chart data could not be loaded.</p>
          ) : !monthHasReadings ? (
            <div className="empty-readings">
              <p>No readings to show this month.</p>
              <span>Daily reading counts will appear here.</span>
            </div>
          ) : (
            <div className="report-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readingTrendData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="#e8eaf2" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="chartDate"
                    interval="preserveStartEnd"
                    minTickGap={18}
                    tick={{ fill: "#777f91", fontSize: 12 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: "#777f91", fontSize: 12 }} width={36} />
                  <Tooltip />
                  <Bar
                    dataKey="totalReadings"
                    fill="#42a899"
                    name="Readings"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
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
