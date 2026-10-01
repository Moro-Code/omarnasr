import test from "node:test";
import assert from "node:assert/strict";
import {
  summarizeWorkouts,
  workoutDate,
  durationLabel,
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
  } finally {
    global.fetch = oldFetch;
    names.forEach((n, i) => {
      if (old[i] === undefined) delete process.env[n];
      else process.env[n] = old[i];
    });
  }
});
