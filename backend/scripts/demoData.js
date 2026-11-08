const TIME_SLOTS = ["morning", "after_breakfast", "afternoon", "evening", "bedtime"];
const READING_DAYS = 134;

export function createDemoReadings(endDate = new Date()) {
  const end = new Date(Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate()
  ));
  const readings = [];

  for (let dayOffset = READING_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const readingDate = new Date(end);
    readingDate.setUTCDate(readingDate.getUTCDate() - dayOffset);
    const date = readingDate.toISOString().slice(0, 10);

    TIME_SLOTS.forEach((timeSlot, slotIndex) => {
      const variation = ((dayOffset * 17 + slotIndex * 23) % 70);
      readings.push({
        reading_date: date,
        time_slot: timeSlot,
        value: 95 + variation
      });
    });
  }

  return readings;
}
