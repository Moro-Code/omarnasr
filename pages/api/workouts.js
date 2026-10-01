import { createHash, timingSafeEqual } from "node:crypto";
import {
  summarizeWorkouts,
  workoutDate,
  WORKOUT_TIME_ZONE,
} from "../../lib/workouts.mjs";

export const config = { api: { bodyParser: { sizeLimit: "256kb" } } };
const key = (date) => `omarnasr:workouts:${date}`;
const unknown = () => ({
  status: "unavailable",
  source: "Apple Health",
  date: workoutDate(),
  timeZone: WORKOUT_TIME_ZONE,
});
function authorized(header) {
  const secret = process.env.WORKOUT_INGEST_TOKEN;
  if (!secret || secret.length < 32 || typeof header !== "string") return false;
  return timingSafeEqual(
    createHash("sha256").update(header).digest(),
    createHash("sha256").update(`Bearer ${secret}`).digest(),
  );
}
async function redis(command) {
  const endpoint = new URL(process.env.UPSTASH_REDIS_REST_URL);
  if (endpoint.protocol !== "https:")
    throw new Error("Invalid storage configuration");
  const response = await fetch(endpoint, {
    method: "POST",
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error("Storage unavailable");
  const result = await response.json();
  if (result.error) throw new Error("Storage unavailable");
  return result.result;
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex");
  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (req.method !== "GET" && !authorized(req.headers.authorization))
    return res.status(401).json({ error: "Unauthorized" });
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
    return res.status(503).json(unknown());
  try {
    if (req.method === "DELETE") {
      await redis([
        "DEL",
        key(workoutDate()),
        key(workoutDate(Date.now() - 86400000)),
        key(workoutDate(Date.now() - 172800000)),
      ]);
      return res.status(200).json({ deleted: true });
    }
    if (req.method === "POST") {
      // Each upload is a complete Today snapshot: disable batching in the exporter.
      if (req.headers["x-workout-window"] !== "today")
        return res
          .status(400)
          .json({
            error: "Send a complete Today export with X-Workout-Window: today",
          });
      let data;
      try {
        data = summarizeWorkouts(req.body);
      } catch {
        return res
          .status(422)
          .json({
            error:
              "Invalid Today workout export; use Health Auto Export JSON v2 with timezone-aware dates",
          });
      }
      // Atomic replacement handles edits/deletions and makes repeat uploads idempotent.
      await redis(["SET", key(data.date), JSON.stringify(data), "EX", 172800]);
      return res
        .status(200)
        .json({ accepted: data.totals.count, date: data.date });
    }
    const snapshot = await redis(["GET", key(workoutDate())]);
    if (!snapshot) return res.status(503).json(unknown());
    const data = JSON.parse(snapshot);
    if (data.date !== workoutDate()) return res.status(503).json(unknown());
    // A known workout stays true for its day. An old empty sync is inconclusive.
    if (
      !data.didWorkout &&
      Date.now() - new Date(data.checkedAt).getTime() > 7200000
    )
      return res.status(503).json(unknown());
    return res.status(200).json(data);
  } catch {
    return res.status(503).json(unknown());
  }
}
