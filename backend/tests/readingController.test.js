import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteReading,
  normalizeTimeSlot,
  updateReading
} from "../controllers/readingController.js";

function createResponse() {
  return {
    body: null,
    statusCode: 200,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test("morning and after-breakfast readings use separate slots", () => {
  assert.equal(normalizeTimeSlot("morning"), "morning");
  assert.equal(normalizeTimeSlot("after_breakfast"), "after_breakfast");
  assert.notEqual(normalizeTimeSlot("morning"), normalizeTimeSlot("after_breakfast"));
});

test("after-lunch and after-dinner keep their existing backend slots", () => {
  assert.equal(normalizeTimeSlot("after_lunch"), "afternoon");
  assert.equal(normalizeTimeSlot("after_dinner"), "evening");
});

test("update rejects malformed reading ids before accessing the database", async () => {
  const res = createResponse();
  await updateReading({ params: { id: "invalid" }, body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Reading id must be a positive integer" });
});

test("update rejects invalid dates before accessing the database", async () => {
  const res = createResponse();
  await updateReading({
    params: { id: "1" },
    body: { reading_date: "2025-02-30", time_slot: "morning", value: 100 }
  }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "reading_date must be a valid YYYY-MM-DD date" });
});

test("delete rejects malformed reading ids before accessing the database", async () => {
  const res = createResponse();
  await deleteReading({ params: { id: "0" } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Reading id must be a positive integer" });
});
