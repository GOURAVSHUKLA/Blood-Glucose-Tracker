import assert from "node:assert/strict";
import test from "node:test";
import { createDemoReadings } from "../scripts/demoData.js";

test("demo dataset contains 670 valid readings across 134 consecutive days", () => {
  const readings = createDemoReadings(new Date("2026-11-08T12:00:00.000Z"));

  assert.equal(readings.length, 670);
  assert.equal(readings[0].reading_date, "2026-06-28");
  assert.equal(readings.at(-1).reading_date, "2026-11-08");

  const readingsPerDate = new Map();
  const uniqueReadingKeys = new Set();
  for (const reading of readings) {
    assert.ok(["morning", "after_breakfast", "afternoon", "evening", "bedtime"].includes(reading.time_slot));
    assert.ok(reading.value >= 40 && reading.value <= 600);
    readingsPerDate.set(
      reading.reading_date,
      (readingsPerDate.get(reading.reading_date) ?? 0) + 1
    );
    uniqueReadingKeys.add(`${reading.reading_date}:${reading.time_slot}`);
  }

  assert.equal(readingsPerDate.size, 134);
  assert.ok([...readingsPerDate.values()].every((count) => count === 5));
  assert.equal(uniqueReadingKeys.size, readings.length);
});

test("demo dataset is deterministic for the same end date", () => {
  const endDate = new Date("2026-11-08T00:00:00.000Z");

  assert.deepEqual(createDemoReadings(endDate), createDemoReadings(endDate));
});
