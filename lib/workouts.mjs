export const WORKOUT_TIME_ZONE = "America/Toronto";
export const STRAVA_PROFILE = "https://www.strava.com/athletes/1519100743";

export function workoutDate(value = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WORKOUT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"]
    .map((name) => parts.find((part) => part.type === name).value)
    .join("-");
}
function parseHealthDate(value) {
  if (typeof value !== "string") throw new Error("Invalid workout date");
  const normalized = value.replace(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/,
    "$1T$2$3:$4",
  );
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(normalized))
    throw new Error("Workout dates require a timezone");
  const date = new Date(normalized);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid workout date");
  return date;
}
function metres(distance) {
  if (distance === undefined || distance === null) return 0;
  const multiplier = { m: 1, km: 1000, mi: 1609.344, yd: 0.9144 }[
    distance.units
  ];
  if (!multiplier || !Number.isFinite(distance.qty) || distance.qty < 0)
    throw new Error("Invalid workout distance");
  return Math.round(distance.qty * multiplier * 100) / 100;
}
// Accept Health Auto Export v2; allowlist before storage or public responses.
export function summarizeWorkouts(payload, now = new Date()) {
  const source = payload?.data?.workouts ?? payload?.workouts;
  if (!Array.isArray(source) || source.length > 200)
    throw new Error("Expected up to 200 workouts");
  const date = workoutDate(now);
  const seen = new Set();
  const workouts = [];
  for (const activity of source) {
    if (
      !activity ||
      typeof activity.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(activity.id) ||
      typeof activity.name !== "string" ||
      !activity.name.trim()
    )
      throw new Error("Invalid workout identity");
    const start = parseHealthDate(activity.start);
    const end = parseHealthDate(activity.end);
    if (
      end < start ||
      end > now ||
      start > now ||
      !Number.isFinite(activity.duration) ||
      activity.duration < 0 ||
      activity.duration > (end - start) / 1000 + 60
    )
      throw new Error("Invalid workout duration");
    const distanceMetres = metres(activity.distance);
    if (workoutDate(start) !== date || seen.has(activity.id)) continue;
    seen.add(activity.id);
    workouts.push({
      id: activity.id,
      name: activity.name.trim().slice(0, 100),
      sport: activity.name.trim().slice(0, 100),
      startedAt: start.toISOString(),
      distanceMetres,
      durationSeconds: Math.round(activity.duration),
    });
  }
  if (source.length > 0 && workouts.length === 0)
    throw new Error("Export does not contain today's workouts");
  workouts.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  return {
    status: "ready",
    source: "Apple Health",
    date,
    timeZone: WORKOUT_TIME_ZONE,
    checkedAt: now.toISOString(),
    didWorkout: workouts.length > 0,
    workouts,
    totals: {
      count: workouts.length,
      distanceMetres: workouts.reduce((n, w) => n + w.distanceMetres, 0),
      durationSeconds: workouts.reduce((n, w) => n + w.durationSeconds, 0),
    },
  };
}
export function durationLabel(seconds) {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes} min`;
}
