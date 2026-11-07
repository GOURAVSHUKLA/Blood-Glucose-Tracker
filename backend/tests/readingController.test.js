import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTimeSlot } from "../controllers/readingController.js";

test("morning and after-breakfast readings use separate slots", () => {
  assert.equal(normalizeTimeSlot("morning"), "morning");
  assert.equal(normalizeTimeSlot("after_breakfast"), "after_breakfast");
  assert.notEqual(normalizeTimeSlot("morning"), normalizeTimeSlot("after_breakfast"));
});

test("after-lunch and after-dinner keep their existing backend slots", () => {
  assert.equal(normalizeTimeSlot("after_lunch"), "afternoon");
  assert.equal(normalizeTimeSlot("after_dinner"), "evening");
});
