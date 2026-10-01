export default function handler(req, res) { res.status(503).json({ status: "unavailable" }); }
