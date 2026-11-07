import { useState } from "react";
import Button from "./Button.jsx";
import Card from "./Card.jsx";
import { apiRequest } from "../services/api.js";

const TIME_SLOTS = [
  { value: "morning", label: "Morning" },
  { value: "after_breakfast", label: "After breakfast" },
  { value: "after_lunch", label: "After lunch" },
  { value: "after_dinner", label: "After dinner" },
];

const CANONICAL_TIME_SLOTS = {
  morning: "morning",
  after_breakfast: "after_breakfast",
  after_lunch: "afternoon",
  after_dinner: "evening",
};

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getReadingErrorMessage(error) {
  const statusCode = error?.response?.status;
  const serverMessage = error?.response?.data?.error ?? error?.response?.data?.message;

  if (statusCode === 409) {
    return serverMessage || "A reading already exists for this date and time slot.";
  }

  if (statusCode === 400) {
    return serverMessage || "Check the date, time slot, and glucose value.";
  }

  if (typeof statusCode === "number" && statusCode >= 500) {
    return serverMessage || "The server could not save this reading. Please try again.";
  }

  if (error?.request && !error?.response) {
    return "Could not reach the server. Check that the backend is running and try again.";
  }

  return error?.message || "Unable to save this reading.";
}

export default function ReadingForm({
  readings,
  isLoadingReadings,
  loadError,
  onReadingCreated,
}) {
  const today = getLocalDateValue();
  const [form, setForm] = useState({
    readingDate: today,
    timeSlot: "",
    value: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [status, setStatus] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
    setSubmitError("");
    setStatus("");
  }

  function validateForm() {
    const nextErrors = {};
    const numericValue = Number(form.value);

    if (!form.readingDate) {
      nextErrors.readingDate = "Date is required.";
    } else if (form.readingDate > today) {
      nextErrors.readingDate = "Future dates are not allowed.";
    }

    if (!form.timeSlot) {
      nextErrors.timeSlot = "Choose a time slot.";
    }

    if (form.value.trim() === "") {
      nextErrors.value = "Glucose value is required.";
    } else if (!Number.isInteger(numericValue)) {
      nextErrors.value = "Enter a whole number.";
    } else if (numericValue < 40 || numericValue > 600) {
      nextErrors.value = "Value must be between 40 and 600 mg/dL.";
    }

    if (
      form.readingDate &&
      form.readingDate <= today &&
      form.timeSlot &&
      !nextErrors.readingDate
    ) {
      const readingsForDate = readings.filter(
        (reading) => String(reading.reading_date).slice(0, 10) === form.readingDate,
      );

      if (readingsForDate.length >= 4) {
        nextErrors.timeSlot = "A maximum of four readings is allowed per day.";
      } else {
        const selectedSlot = CANONICAL_TIME_SLOTS[form.timeSlot];
        const duplicateSlot = readingsForDate.some(
          (reading) => reading.time_slot === selectedSlot,
        );
        if (duplicateSlot) {
          nextErrors.timeSlot = "A reading already exists for this date and time slot.";
        }
      }
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);
    setSubmitError("");
    setStatus("");

    if (Object.keys(nextErrors).length > 0 || isLoadingReadings || loadError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiRequest("/readings", {
        method: "POST",
        data: {
          reading_date: form.readingDate,
          time_slot: form.timeSlot,
          value: Number(form.value),
        },
      });

      if (!result?.reading) {
        throw new Error("The server response did not include the saved reading.");
      }

      onReadingCreated(result.reading);
      setStatus(result.message || "Reading saved successfully.");
      setForm((currentForm) => ({ ...currentForm, value: "" }));
    } catch (error) {
      setSubmitError(getReadingErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const readingsForSelectedDate = readings.filter(
    (reading) => String(reading.reading_date).slice(0, 10) === form.readingDate,
  );
  const isBusy = isLoadingReadings || isSubmitting;

  return (
    <Card className="reading-form-card">
      <div className="reading-form-heading">
        <p className="eyebrow">Daily tracking</p>
        <h2>Add a glucose reading</h2>
        <p>Record a value between 40 and 600 mg/dL.</p>
      </div>

      {loadError ? (
        <p className="reading-count" role="status">
          Existing readings could not be checked. Retry loading the table before saving.
        </p>
      ) : (
        <p className="reading-count" role="status">
          {isLoadingReadings
            ? "Checking existing readings…"
            : `${readingsForSelectedDate.length} of 4 readings recorded for this date.`}
        </p>
      )}

      <form className="reading-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="readingDate">Date</label>
          <input
            id="readingDate"
            max={today}
            name="readingDate"
            onChange={handleChange}
            aria-describedby={errors.readingDate ? "readingDate-error" : undefined}
            aria-invalid={Boolean(errors.readingDate)}
            type="date"
            value={form.readingDate}
          />
          {errors.readingDate && (
            <p className="field-error" id="readingDate-error">{errors.readingDate}</p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="timeSlot">Time slot</label>
          <select
            id="timeSlot"
            name="timeSlot"
            onChange={handleChange}
            aria-describedby={errors.timeSlot ? "timeSlot-error" : undefined}
            aria-invalid={Boolean(errors.timeSlot)}
            value={form.timeSlot}
          >
            <option value="">Choose a time slot</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
          {errors.timeSlot && <p className="field-error" id="timeSlot-error">{errors.timeSlot}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="value">Glucose value (mg/dL)</label>
          <input
            id="value"
            max="600"
            min="40"
            name="value"
            onChange={handleChange}
            aria-describedby={errors.value ? "value-error" : undefined}
            aria-invalid={Boolean(errors.value)}
            step="1"
            type="number"
            value={form.value}
          />
          {errors.value && <p className="field-error" id="value-error">{errors.value}</p>}
        </div>

        <Button className="auth-submit" disabled={isBusy || Boolean(loadError)} type="submit">
          {isSubmitting ? "Saving reading..." : "Save reading"}
        </Button>

        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        {status && <p className="form-message" role="status">{status}</p>}
      </form>
    </Card>
  );
}
