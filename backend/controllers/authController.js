function notImplemented(_req, res) {
  return res.status(501).json({ error: "Authentication is not implemented yet" });
}

export const signup = notImplemented;
export const login = notImplemented;

