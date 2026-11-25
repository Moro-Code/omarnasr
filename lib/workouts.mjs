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
// Public reads keep the fields the widget renders and drop Apple Health UUIDs.
export function publicWorkoutSnapshot(data) {
  const workouts = Array.isArray(data?.workouts) ? data.workouts : [];
  const totals = data?.totals ?? {};
  return {
    status: data?.status,
    source: data?.source,
    date: data?.date,
    timeZone: data?.timeZone,
    checkedAt: data?.checkedAt,
    didWorkout: data?.didWorkout,
    workouts: workouts.map((workout) => ({
      name: workout?.name,
      sport: workout?.sport,
      startedAt: workout?.startedAt,
      distanceMetres: workout?.distanceMetres,
      durationSeconds: workout?.durationSeconds,
    })),
    totals: {
      count: totals.count,
      distanceMetres: totals.distanceMetres,
      durationSeconds: totals.durationSeconds,
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

const STALE_EMPTY_MS = 2 * 60 * 60 * 1000;
const CURRENT_SYNC_MS = 24 * 60 * 60 * 1000;

export function shiftWorkoutDate(date, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? "");
  if (!match || !Number.isInteger(days)) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  )
    return null;
  utc.setUTCDate(utc.getUTCDate() + days);
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function unavailableWorkout(date = workoutDate()) {
  return {
    status: "unavailable",
    source: "Apple Health",
    date,
    timeZone: WORKOUT_TIME_ZONE,
  };
}

function isStaleEmptySnapshot(data, now) {
  if (!data || data.didWorkout) return false;
  const checked = new Date(data.checkedAt).getTime();
  return Number.isFinite(checked) && now.getTime() - checked > STALE_EMPTY_MS;
}

function confirmedPublicSnapshot(data, expectedDate) {
  if (
    !data ||
    data.status !== "ready" ||
    data.date !== expectedDate ||
    data.didWorkout !== true ||
    !Array.isArray(data.workouts) ||
    data.workouts.length === 0
  )
    return null;
  const published = publicWorkoutSnapshot(data);
  if (
    published.didWorkout !== true ||
    published.date !== expectedDate ||
    published.workouts.length === 0
  )
    return null;
  return published;
}

// A missing current-day snapshot is pending, not an outage. An empty sync older
// than two hours stays inconclusive. A logged workout stays confirmed all day.
export function resolveWorkoutRead({
  today,
  todaySnapshot = null,
  prior = [],
  now = new Date(),
} = {}) {
  if (todaySnapshot && todaySnapshot.date === today) {
    if (isStaleEmptySnapshot(todaySnapshot, now))
      return { statusCode: 200, body: unavailableWorkout(today) };
    return { statusCode: 200, body: publicWorkoutSnapshot(todaySnapshot) };
  }
  const body = {
    status: "pending",
    source: "Apple Health",
    date: today,
    timeZone: WORKOUT_TIME_ZONE,
    sync: "none",
  };
  for (const entry of prior) {
    const published = confirmedPublicSnapshot(entry?.snapshot, entry?.date);
    if (!published || !(published.date < today)) continue;
    body.prior = published;
    break;
  }
  return { statusCode: 200, body };
}

function ottawaClock(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WORKOUT_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function calendarDay(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? "");
  if (!match) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WORKOUT_TIME_ZONE,
    month: "long",
    day: "numeric",
  }).format(
    new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 17),
    ),
  );
}

function relativeDay(date, today) {
  if (date === shiftWorkoutDate(today, -1)) return "Yesterday";
  return calendarDay(date);
}

function visibleWorkouts(workouts) {
  if (!Array.isArray(workouts)) return [];
  return workouts
    .filter(
      (workout) =>
        workout &&
        typeof workout.name === "string" &&
        workout.name.trim() &&
        typeof workout.startedAt === "string" &&
        Number.isFinite(new Date(workout.startedAt).getTime()) &&
        Number.isFinite(workout.durationSeconds),
    )
    .map((workout) => ({
      name: workout.name,
      sport: workout.sport,
      startedAt: workout.startedAt,
      distanceMetres: workout.distanceMetres,
      durationSeconds: workout.durationSeconds,
    }));
}

function loadingCheckIn() {
  return {
    state: "loading",
    label: "Checking in…",
    explanation: "Checking today’s workout sync.",
    indicator: "·",
    tone: "unknown",
    showStats: false,
    statsFirst: true,
    statsLabel: null,
    totals: null,
    workouts: [],
    feedTitle: "Today’s workouts",
    feedMeta: "Latest first",
    empty: "Fetching the latest check-in…",
    footer: "Apple Health · Ottawa time",
    retry: false,
    strava: false,
  };
}

function unavailableCheckIn() {
  return {
    state: "unavailable",
    label: "Status unavailable",
    explanation:
      "Today’s activity hasn’t been confirmed here. You can still catch up with me on Strava.",
    indicator: "·",
    tone: "unknown",
    showStats: false,
    statsFirst: true,
    statsLabel: null,
    totals: null,
    workouts: [],
    feedTitle: "Today’s workouts",
    feedMeta: "Latest first",
    empty: "The next update will appear here.",
    footer: "Apple Health · Ottawa time",
    retry: true,
    strava: false,
  };
}

export function describeCheckIn(feed, now) {
  if (!feed) return loadingCheckIn();
  const clock = now instanceof Date ? now : null;
  if (!clock || !Number.isFinite(clock.getTime())) return loadingCheckIn();
  const today = workoutDate(clock);
  const age = clock.getTime() - new Date(feed.checkedAt).getTime();
  const fresh =
    feed.status === "ready" &&
    feed.date === today &&
    Array.isArray(feed.workouts) &&
    feed.totals &&
    Number.isFinite(feed.totals.count) &&
    Number.isFinite(feed.totals.durationSeconds) &&
    Number.isFinite(feed.totals.distanceMetres) &&
    age < CURRENT_SYNC_MS;
  if (fresh) {
    const workedOut = feed.didWorkout === true;
    const synced = ottawaClock(feed.checkedAt);
    return {
      state: workedOut ? "worked-out" : "not-yet",
      label: workedOut ? "Yes. Work put in." : "Not yet today.",
      explanation: workedOut
        ? `${feed.totals.count} ${feed.totals.count === 1 ? "workout" : "workouts"} logged today. Every session counts.`
        : "No workouts in the latest Apple Health sync. The day’s not over yet.",
      indicator: workedOut ? "✓" : "—",
      tone: workedOut ? "yes" : "notYet",
      showStats: true,
      statsFirst: true,
      statsLabel: null,
      totals: feed.totals,
      workouts: workedOut ? visibleWorkouts(feed.workouts) : [],
      feedTitle: "Today’s workouts",
      feedMeta: "Latest first",
      empty: "A fresh day, a clean slate.",
      footer: synced
        ? `Synced ${synced} · Ottawa time`
        : "Apple Health · Ottawa time",
      retry: false,
      strava: true,
    };
  }
  const pendingToday =
    feed.status === "pending" && feed.sync === "none" && feed.date === today;
  const prior = pendingToday ? feed.prior : null;
  const retained = [shiftWorkoutDate(today, -1), shiftWorkoutDate(today, -2)];
  const day =
    prior &&
    prior.status === "ready" &&
    prior.didWorkout === true &&
    retained.includes(prior.date) &&
    prior.totals &&
    Number.isFinite(prior.totals.count) &&
    Number.isFinite(prior.totals.durationSeconds) &&
    Number.isFinite(prior.totals.distanceMetres)
      ? relativeDay(prior.date, today)
      : null;
  const priorWorkouts = day ? visibleWorkouts(prior.workouts) : [];
  if (day && priorWorkouts.length > 0) {
    const synced = ottawaClock(prior.checkedAt);
    const yesterday = day === "Yesterday";
    return {
      state: "fallback",
      label: "No sync yet today.",
      explanation: yesterday
        ? "Yesterday’s confirmed check-in is below. Today’s Apple Health export hasn’t landed yet."
        : `The last confirmed check-in, ${day}, is below. Today’s Apple Health export hasn’t landed yet.`,
      indicator: "·",
      tone: "unknown",
      showStats: true,
      statsFirst: false,
      statsLabel: yesterday ? "Yesterday’s totals" : `${day} totals`,
      totals: prior.totals,
      workouts: priorWorkouts,
      feedTitle: yesterday
        ? "Yesterday’s confirmed check-in"
        : "Last confirmed check-in",
      feedMeta: calendarDay(prior.date),
      empty: "The next update will appear here.",
      footer: synced
        ? `Last confirmed sync ${synced} · ${day}`
        : `Apple Health · ${day}`,
      retry: true,
      strava: false,
    };
  }
  if (pendingToday) {
    return {
      state: "unsynced",
      label: "No sync yet today.",
      explanation:
        "Today’s Apple Health export hasn’t arrived yet. You can still catch up with me on Strava.",
      indicator: "·",
      tone: "unknown",
      showStats: false,
      statsFirst: true,
      statsLabel: null,
      totals: null,
      workouts: [],
      feedTitle: "Today’s workouts",
      feedMeta: "Waiting for sync",
      empty: "The next update will appear here.",
      footer: "Apple Health · Ottawa time",
      retry: true,
      strava: false,
    };
  }
  return unavailableCheckIn();
}
