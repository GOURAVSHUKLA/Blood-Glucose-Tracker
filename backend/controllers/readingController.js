function notImplemented(_req, res) {
  return res.status(501).json({ error: "Glucose readings are not implemented yet" });
}

export const listReadings = notImplemented;
export const createReading = notImplemented;

