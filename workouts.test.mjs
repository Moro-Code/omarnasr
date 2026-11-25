import test from "node:test";
import assert from "node:assert/strict";
import {
  summarizeWorkouts,
  workoutDate,
  shiftWorkoutDate,
  durationLabel,
  publicWorkoutSnapshot,
  resolveWorkoutRead,
  describeCheckIn,
} from "./lib/workouts.mjs";
import handler from "./pages/api/workouts.js";
const sample = (overrides = {}) => ({
  id: "test-1",
  name: "Running",
  start: "2026-09-30 21:00:00 -0400",
  end: "2026-09-30 21:30:00 -0400",
  duration: 1800,
  distance: { qty: 5, units: "km" },
  ...overrides,
});
const now = new Date("2026-10-01T02:00:00Z");
test("Ottawa date handles midnight and daylight saving changes", () => {
  assert.equal(workoutDate("2026-10-01T03:59:59Z"), "2026-09-30");
  assert.equal(workoutDate("2026-10-01T04:00:00Z"), "2026-10-01");
  assert.equal(workoutDate("2026-01-01T04:59:59Z"), "2025-12-31");
  assert.equal(workoutDate("2026-01-01T05:00:00Z"), "2026-01-01");
  assert.equal(workoutDate("2026-03-08T07:00:00Z"), "2026-03-08");
  assert.equal(workoutDate("2026-11-01T06:00:00Z"), "2026-11-01");
});
test("normalizes Health Auto Export v2, deduplicates and sorts latest first", () => {
  const result = summarizeWorkouts(
    {
      data: {
        workouts: [
          sample(),
          sample({
            id: "test-2",
            start: "2026-09-30T12:00:00Z",
            end: "2026-09-30T13:00:00Z",
            name: "Strength Training",
            duration: 3600,
            distance: undefined,
          }),
          sample(),
        ],
      },
    },
    now,
  );
  assert.deepEqual(
    result.workouts.map((w) => w.id),
    ["test-1", "test-2"],
  );
  assert.deepEqual(result.totals, {
    count: 2,
    distanceMetres: 5000,
    durationSeconds: 5400,
  });
  assert.equal(result.source, "Apple Health");
  assert.equal(result.date, "2026-09-30");
});
test("converts miles and excludes sensitive fields before storage", () => {
  const result = summarizeWorkouts(
    {
      workouts: [
        sample({
          distance: { qty: 1, units: "mi" },
          heartRate: { avg: 150 },
          route: [{ latitude: 45, longitude: -75 }],
          activeEnergy: { qty: 200 },
        }),
      ],
    },
    now,
  );
  assert.equal(result.totals.distanceMetres, 1609.34);
  assert.deepEqual(
    Object.keys(result.workouts[0]).sort(),
    [
      "id",
      "name",
      "sport",
      "startedAt",
      "distanceMetres",
      "durationSeconds",
    ].sort(),
  );
});
test("invalid, future, offset-free and old-only data cannot overwrite a snapshot", () => {
  for (const entry of [
    sample({ start: "invalid" }),
    sample({ start: "2026-09-30T21:00:00" }),
    sample({ duration: -1 }),
    sample({ distance: { qty: 5, units: "unknown" } }),
    sample({ start: "2026-10-01T03:00:00Z", end: "2026-10-01T03:30:00Z" }),
    sample({ start: "2026-09-29T03:00:00Z", end: "2026-09-29T03:30:00Z" }),
  ])
    assert.throws(() => summarizeWorkouts({ workouts: [entry] }, now));
  assert.throws(() => summarizeWorkouts({}, now));
});
test("public snapshots omit health identifiers and unused fields", () => {
  const published = publicWorkoutSnapshot({
    status: "ready",
    source: "Apple Health",
    date: "2026-09-30",
    timeZone: "America/Toronto",
    checkedAt: "2026-10-01T02:00:00.000Z",
    didWorkout: true,
    rawExportId: "should-not-leak",
    workouts: [
      {
        id: "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
        name: "Running",
        sport: "Running",
        startedAt: "2026-09-30T21:00:00.000Z",
        distanceMetres: 5000,
        durationSeconds: 1800,
        route: [{ latitude: 45, longitude: -75 }],
      },
    ],
    totals: { count: 1, distanceMetres: 5000, durationSeconds: 1800 },
  });
  const encoded = JSON.stringify(published);
  assert.equal(encoded.includes("AAAAAAAA"), false);
  assert.equal(encoded.includes("route"), false);
  assert.equal(encoded.includes("rawExportId"), false);
  assert.equal(published.workouts[0].id, undefined);
  assert.equal(published.workouts[0].name, "Running");
  assert.deepEqual(published.totals, {
    count: 1,
    distanceMetres: 5000,
    durationSeconds: 1800,
  });
});
test("empty export is explicit and has zero totals", () => {
  const result = summarizeWorkouts({ data: { workouts: [] } }, now);
  assert.equal(result.didWorkout, false);
  assert.deepEqual(result.totals, {
    count: 0,
    distanceMetres: 0,
    durationSeconds: 0,
  });
  assert.equal(durationLabel(3660), "1h 1m");
});
function response() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(s) {
      this.statusCode = s;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
test("endpoint protects writes, safely handles missing configuration and storage failures", async () => {
  const res = response();
  await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.didWorkout, undefined);
  const denied = response();
  await handler({ method: "POST", headers: {}, body: {} }, denied);
  assert.equal(denied.statusCode, 401);
  const method = response();
  await handler({ method: "PATCH", headers: {} }, method);
  assert.equal(method.statusCode, 405);
});
test("authenticated full snapshots persist only safe fields; reads and delete work", async () => {
  const oldFetch = global.fetch;
  const names = [
    "WORKOUT_INGEST_TOKEN",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ];
  const old = names.map((n) => process.env[n]);
  const secret = "test-secret-" + "a".repeat(40);
  process.env.WORKOUT_INGEST_TOKEN = secret;
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-db-token";
  const store = new Map();
  global.fetch = async (url, opts) => {
    const [command, key, value] = JSON.parse(opts.body);
    if (command === "SET") store.set(key, value);
    if (command === "DEL")
      for (const k of JSON.parse(opts.body).slice(1)) store.delete(k);
    return {
      ok: true,
      json: async () => ({
        result: command === "GET" ? (store.get(key) ?? null) : "OK",
      }),
    };
  };
  try {
    const headers = {
      authorization: `Bearer ${secret}`,
      "x-workout-window": "today",
    };
    const post = response();
    await handler(
      { method: "POST", headers, body: { data: { workouts: [] } } },
      post,
    );
    assert.equal(post.statusCode, 200);
    const get = response();
    await handler({ method: "GET", headers: {} }, get);
    assert.equal(get.statusCode, 200);
    assert.equal(get.body.didWorkout, false);
    const bad = response();
    await handler(
      { method: "POST", headers, body: { workouts: [{ id: "bad" }] } },
      bad,
    );
    assert.equal(bad.statusCode, 422);
    const again = response();
    await handler({ method: "GET", headers: {} }, again);
    assert.equal(again.body.didWorkout, false);
    const missing = response();
    await handler(
      {
        method: "POST",
        headers: { authorization: `Bearer ${secret}` },
        body: { workouts: [] },
      },
      missing,
    );
    assert.equal(missing.statusCode, 400);
    const clear = response();
    await handler({ method: "DELETE", headers }, clear);
    assert.equal(clear.body.deleted, true);
    assert.equal(store.size, 0);
    global.fetch = async () => {
      throw new Error("private-token-must-not-leak");
    };
    const failed = response();
    await handler({ method: "GET", headers: {} }, failed);
    assert.equal(failed.statusCode, 503);
    assert.equal(JSON.stringify(failed.body).includes("private-token"), false);
    const identified = {
      status: "ready",
      source: "Apple Health",
      date: workoutDate(),
      timeZone: "America/Toronto",
      checkedAt: new Date().toISOString(),
      didWorkout: true,
      workouts: [
        {
          id: "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
          name: "Running",
          sport: "Running",
          startedAt: new Date().toISOString(),
          distanceMetres: 1000,
          durationSeconds: 600,
        },
      ],
      totals: { count: 1, distanceMetres: 1000, durationSeconds: 600 },
    };
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ result: JSON.stringify(identified) }),
    });
    const visible = response();
    await handler({ method: "GET", headers: {} }, visible);
    assert.equal(visible.statusCode, 200);
    assert.equal(visible.body.workouts[0].name, "Running");
    assert.equal(visible.body.workouts[0].id, undefined);
    assert.equal(JSON.stringify(visible.body).includes("AAAAAAAA"), false);
  } finally {
    global.fetch = oldFetch;
    names.forEach((n, i) => {
      if (old[i] === undefined) delete process.env[n];
      else process.env[n] = old[i];
    });
  }
});

const morning = new Date("2026-11-25T14:16:00Z");
const healthId = "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE";
function stored(date, overrides = {}) {
  return {
    status: "ready",
    source: "Apple Health",
    date,
    timeZone: "America/Toronto",
    checkedAt: "2026-11-24T23:00:00.000Z",
    didWorkout: true,
    workouts: [
      {
        id: healthId,
        name: "Running",
        sport: "Running",
        startedAt: "2026-11-24T22:00:00.000Z",
        distanceMetres: 5000,
        durationSeconds: 1800,
        heartRate: { avg: 150 },
      },
    ],
    totals: { count: 1, distanceMetres: 5000, durationSeconds: 1800 },
    ...overrides,
  };
}
test("calendar shift stays on the Ottawa date across months", () => {
  assert.equal(shiftWorkoutDate("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftWorkoutDate("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftWorkoutDate("2026-11-25", -2), "2026-11-23");
  assert.equal(shiftWorkoutDate("2026-02-31", -1), null);
});
test("no current sync can fall back to the newest confirmed check-in only", () => {
  const today = "2026-11-25";
  const yesterday = "2026-11-24";
  const older = "2026-11-23";
  const none = resolveWorkoutRead({ today, todaySnapshot: null, prior: [] });
  assert.equal(none.statusCode, 200);
  assert.equal(none.body.status, "pending");
  assert.equal(none.body.sync, "none");
  assert.equal(none.body.prior, undefined);
  assert.equal(none.body.didWorkout, undefined);
  const fallback = resolveWorkoutRead({
    today,
    todaySnapshot: null,
    prior: [
      {
        date: yesterday,
        snapshot: stored(yesterday, { didWorkout: false, workouts: [] }),
      },
      { date: older, snapshot: stored(older, { date: older }) },
    ],
  });
  assert.equal(fallback.body.prior.date, older);
  assert.equal(fallback.body.prior.didWorkout, true);
  assert.equal(fallback.body.prior.workouts[0].id, undefined);
  assert.equal(JSON.stringify(fallback.body).includes(healthId), false);
  assert.equal(JSON.stringify(fallback.body).includes("heartRate"), false);
  const recent = resolveWorkoutRead({
    today,
    todaySnapshot: null,
    prior: [
      { date: yesterday, snapshot: stored(yesterday) },
      {
        date: older,
        snapshot: stored(older, {
          date: older,
          workouts: [{ ...stored(older).workouts[0], name: "Older" }],
        }),
      },
    ],
  });
  assert.equal(recent.body.prior.date, yesterday);
  assert.equal(recent.body.prior.workouts[0].name, "Running");
  const freshEmpty = stored(today, {
    checkedAt: morning.toISOString(),
    didWorkout: false,
    workouts: [],
    totals: { count: 0, distanceMetres: 0, durationSeconds: 0 },
  });
  const todayWins = resolveWorkoutRead({
    today,
    todaySnapshot: freshEmpty,
    prior: [{ date: yesterday, snapshot: stored(yesterday) }],
    now: morning,
  });
  assert.equal(todayWins.body.status, "ready");
  assert.equal(todayWins.body.didWorkout, false);
  assert.equal(todayWins.body.prior, undefined);
  const logged = stored(today, {
    checkedAt: new Date(morning.getTime() - 3 * 3600000).toISOString(),
  });
  const stillToday = resolveWorkoutRead({
    today,
    todaySnapshot: logged,
    prior: [{ date: yesterday, snapshot: stored(yesterday) }],
    now: morning,
  });
  assert.equal(stillToday.body.status, "ready");
  assert.equal(stillToday.body.didWorkout, true);
  assert.equal(stillToday.body.workouts[0].id, undefined);
  const stale = stored(today, {
    checkedAt: new Date(morning.getTime() - 3 * 3600000).toISOString(),
    didWorkout: false,
    workouts: [],
    totals: { count: 0, distanceMetres: 0, durationSeconds: 0 },
  });
  const inconclusive = resolveWorkoutRead({
    today,
    todaySnapshot: stale,
    prior: [{ date: yesterday, snapshot: stored(yesterday) }],
    now: morning,
  });
  assert.equal(inconclusive.statusCode, 200);
  assert.equal(inconclusive.body.status, "unavailable");
  assert.equal(inconclusive.body.prior, undefined);
  assert.equal(inconclusive.body.didWorkout, undefined);
});
test("check-in copy distinguishes today, yesterday, and no sync", () => {
  const today = workoutDate(morning);
  const yesterday = shiftWorkoutDate(today, -1);
  const older = shiftWorkoutDate(today, -2);
  assert.equal(describeCheckIn(null, morning).label, "Checking in…");
  const ready = describeCheckIn(
    stored(today, {
      checkedAt: morning.toISOString(),
      workouts: [
        {
          id: healthId,
          name: "Running",
          sport: "Running",
          startedAt: morning.toISOString(),
          distanceMetres: 5000,
          durationSeconds: 1800,
        },
      ],
    }),
    morning,
  );
  assert.equal(ready.state, "worked-out");
  assert.equal(ready.label, "Yes. Work put in.");
  assert.equal(ready.indicator, "✓");
  assert.equal(ready.strava, true);
  assert.equal(ready.workouts[0].id, undefined);
  assert.equal(JSON.stringify(ready).includes(healthId), false);
  const empty = describeCheckIn(
    stored(today, {
      checkedAt: morning.toISOString(),
      didWorkout: false,
      workouts: [],
      totals: { count: 0, distanceMetres: 0, durationSeconds: 0 },
    }),
    morning,
  );
  assert.equal(empty.label, "Not yet today.");
  assert.equal(empty.indicator, "—");
  assert.equal(empty.workouts.length, 0);
  assert.equal(empty.empty, "A fresh day, a clean slate.");
  const prior = stored(yesterday);
  const fallback = describeCheckIn(
    {
      status: "pending",
      sync: "none",
      date: today,
      prior: publicWorkoutSnapshot(prior),
    },
    morning,
  );
  assert.equal(fallback.state, "fallback");
  assert.equal(fallback.label, "No sync yet today.");
  assert.equal(fallback.indicator, "·");
  assert.match(fallback.explanation, /Yesterday’s confirmed check-in/);
  assert.equal(fallback.feedTitle, "Yesterday’s confirmed check-in");
  assert.equal(fallback.feedMeta, "November 24");
  assert.equal(fallback.statsLabel, "Yesterday’s totals");
  assert.equal(fallback.footer, "Last confirmed sync 6:00 p.m. · Yesterday");
  assert.equal(fallback.workouts[0].name, "Running");
  assert.equal(fallback.strava, false);
  assert.equal(fallback.retry, true);
  const olderView = describeCheckIn(
    {
      status: "pending",
      sync: "none",
      date: today,
      prior: publicWorkoutSnapshot(stored(older, { date: older })),
    },
    morning,
  );
  assert.equal(olderView.feedTitle, "Last confirmed check-in");
  assert.match(olderView.explanation, /November 23/);
  assert.doesNotMatch(olderView.explanation, /Yesterday/);
  const unsynced = describeCheckIn(
    { status: "pending", sync: "none", date: today },
    morning,
  );
  assert.equal(unsynced.state, "unsynced");
  assert.equal(unsynced.label, "No sync yet today.");
  assert.match(unsynced.explanation, /hasn’t arrived yet/);
  assert.equal(unsynced.showStats, false);
  assert.equal(unsynced.feedMeta, "Waiting for sync");
  assert.equal(unsynced.workouts.length, 0);
  const unknown = describeCheckIn(
    { status: "unavailable", date: today },
    morning,
  );
  assert.equal(unknown.label, "Status unavailable");
  assert.match(unknown.explanation, /hasn’t been confirmed/);
  assert.equal(unknown.retry, true);
});
function storageKey(date) {
  return `omarnasr:workouts:${date}`;
}
async function withRedis(run) {
  const oldFetch = global.fetch;
  const names = [
    "WORKOUT_INGEST_TOKEN",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ];
  const old = names.map((name) => process.env[name]);
  process.env.WORKOUT_INGEST_TOKEN = "test-secret-" + "b".repeat(40);
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-db-token";
  const store = new Map();
  let mode = "ok";
  global.fetch = async (url, opts) => {
    if (mode === "throw") throw new Error("private-token-must-not-leak");
    const command = JSON.parse(opts.body);
    const [op, key, value] = command;
    if (String(url).startsWith("https:") === false)
      throw new Error("Invalid storage configuration");
    if (op === "SET") store.set(key, value);
    if (op === "DEL") for (const item of command.slice(1)) store.delete(item);
    if (mode === "down")
      return { ok: false, json: async () => ({ error: "nope" }) };
    return {
      ok: true,
      json: async () => ({
        result: op === "GET" ? (store.get(key) ?? null) : "OK",
      }),
    };
  };
  try {
    await run(store, (next) => {
      mode = next;
    });
  } finally {
    global.fetch = oldFetch;
    names.forEach((name, index) => {
      if (old[index] === undefined) delete process.env[name];
      else process.env[name] = old[index];
    });
  }
}
test("a missing snapshot is pending, and a real storage failure stays 503", async () => {
  await withRedis(async (store, setMode) => {
    const today = workoutDate();
    const yesterday = shiftWorkoutDate(today, -1);
    const older = shiftWorkoutDate(today, -2);
    const missing = response();
    await handler({ method: "GET", headers: {} }, missing);
    assert.equal(missing.statusCode, 200);
    assert.equal(missing.body.status, "pending");
    assert.equal(missing.body.sync, "none");
    assert.equal(missing.body.date, today);
    assert.equal(missing.body.prior, undefined);
    store.set(
      storageKey(yesterday),
      JSON.stringify(stored(yesterday, { date: yesterday })),
    );
    const fallback = response();
    await handler({ method: "GET", headers: {} }, fallback);
    assert.equal(fallback.statusCode, 200);
    assert.equal(fallback.body.status, "pending");
    assert.equal(fallback.body.prior.date, yesterday);
    assert.equal(fallback.body.prior.didWorkout, true);
    assert.equal(fallback.body.prior.workouts[0].name, "Running");
    assert.equal(fallback.body.prior.workouts[0].id, undefined);
    assert.equal(JSON.stringify(fallback.body).includes(healthId), false);
    assert.equal(JSON.stringify(fallback.body).includes("heartRate"), false);
    store.delete(storageKey(yesterday));
    store.set(storageKey(yesterday), "{");
    store.set(
      storageKey(older),
      JSON.stringify(stored(older, { date: older })),
    );
    const skipped = response();
    await handler({ method: "GET", headers: {} }, skipped);
    assert.equal(skipped.statusCode, 200);
    assert.equal(skipped.body.prior.date, older);
    store.set(storageKey(today), "{");
    const corrupt = response();
    await handler({ method: "GET", headers: {} }, corrupt);
    assert.equal(corrupt.statusCode, 503);
    assert.equal(corrupt.body.status, "unavailable");
    assert.equal(JSON.stringify(corrupt.body).includes("private-token"), false);
    const hoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    store.set(
      storageKey(today),
      JSON.stringify(
        stored(today, {
          date: today,
          checkedAt: hoursAgo,
          didWorkout: false,
          workouts: [],
          totals: { count: 0, distanceMetres: 0, durationSeconds: 0 },
        }),
      ),
    );
    const stale = response();
    await handler({ method: "GET", headers: {} }, stale);
    assert.equal(stale.statusCode, 200);
    assert.equal(stale.body.status, "unavailable");
    assert.equal(stale.body.prior, undefined);
    store.set(
      storageKey(today),
      JSON.stringify(
        stored(today, {
          date: today,
          checkedAt: new Date().toISOString(),
          didWorkout: false,
          workouts: [],
          totals: { count: 0, distanceMetres: 0, durationSeconds: 0 },
        }),
      ),
    );
    const notYet = response();
    await handler({ method: "GET", headers: {} }, notYet);
    assert.equal(notYet.statusCode, 200);
    assert.equal(notYet.body.status, "ready");
    assert.equal(notYet.body.didWorkout, false);
    assert.equal(notYet.body.prior, undefined);
    store.set(
      storageKey(today),
      JSON.stringify(stored(today, { date: today, checkedAt: hoursAgo })),
    );
    const kept = response();
    await handler({ method: "GET", headers: {} }, kept);
    assert.equal(kept.statusCode, 200);
    assert.equal(kept.body.status, "ready");
    assert.equal(kept.body.didWorkout, true);
    assert.equal(kept.body.prior, undefined);
    assert.equal(kept.body.workouts[0].id, undefined);
    setMode("throw");
    const failed = response();
    await handler({ method: "GET", headers: {} }, failed);
    assert.equal(failed.statusCode, 503);
    assert.equal(JSON.stringify(failed.body).includes("private-token"), false);
    setMode("down");
    const down = response();
    await handler({ method: "GET", headers: {} }, down);
    assert.equal(down.statusCode, 503);
    assert.equal(down.body.status, "unavailable");
  });
});
