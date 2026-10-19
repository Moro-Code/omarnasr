import test from "node:test";
import assert from "node:assert/strict";
import {
  CACHE_HIT_RATE,
  CAPACITY_PER_REPLICA,
  SYSTEM_DEFAULTS,
  calculateSystem,
} from "./lib/platform-lab.mjs";

const near = (actual, expected) => {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `Expected ${actual} to be within 1e-9 of ${expected}`,
  );
};

test("baseline serves 300 illustrative rps on three replicas", () => {
  const result = calculateSystem();
  assert.deepEqual(SYSTEM_DEFAULTS, {
    traffic: 300,
    replicas: 3,
    failed: false,
    cache: false,
  });
  assert.equal(CAPACITY_PER_REPLICA, 120);
  assert.equal(CACHE_HIT_RATE, 0.4);
  assert.equal(result.healthyReplicas, 3);
  assert.equal(result.demand, 300);
  assert.equal(result.capacity, 360);
  assert.equal(result.cached, 0);
  assert.equal(result.served, 300);
  assert.equal(result.dropped, 0);
  near(result.utilization, 83.33333333333333);
  assert.equal(result.state, "strained");
  assert.match(result.message, /Illustrative simulation/);
});

test("one failure removes exactly one replica", () => {
  for (let replicas = 1; replicas <= 4; replicas++) {
    const result = calculateSystem({ replicas, failed: true });
    assert.equal(result.healthyReplicas, replicas - 1);
    assert.equal(result.capacity, (replicas - 1) * 120);
  }
});

test("the baseline challenge drops 60 rps when one replica fails", () => {
  const result = calculateSystem({ failed: true });
  assert.equal(result.capacity, 240);
  assert.equal(result.served, 240);
  assert.equal(result.dropped, 60);
  assert.equal(result.utilization, 125);
  assert.equal(result.state, "overloaded");
});

test("adding a fourth replica solves the 300 rps failure challenge", () => {
  const result = calculateSystem({ replicas: 4, failed: true });
  assert.equal(result.served, 300);
  assert.equal(result.dropped, 0);
  assert.equal(result.state, "strained");
});

test("cache solves the 300 rps failure challenge by bypassing the origin", () => {
  const result = calculateSystem({ failed: true, cache: true });
  assert.equal(result.healthyReplicas, 2);
  assert.equal(result.demand, 180);
  assert.equal(result.capacity, 240);
  assert.equal(result.cached, 120);
  assert.equal(result.served, 300);
  assert.equal(result.dropped, 0);
  assert.equal(result.utilization, 75);
  assert.equal(result.state, "healthy");
  assert.match(result.message, /one replica down/);
});

test("cached requests count as served during partial origin overload", () => {
  const result = calculateSystem({ traffic: 300, replicas: 1, cache: true });
  assert.equal(result.demand, 180);
  assert.equal(result.capacity, 120);
  assert.equal(result.served, 240);
  assert.equal(result.dropped, 60);
  assert.equal(result.utilization, 150);
  assert.equal(result.state, "overloaded");
});

test("one failed sole replica is offline, never negative capacity or NaN", () => {
  const result = calculateSystem({ traffic: 300, replicas: 1, failed: true });
  assert.equal(result.healthyReplicas, 0);
  assert.equal(result.capacity, 0);
  assert.equal(result.served, 0);
  assert.equal(result.dropped, 300);
  assert.equal(result.utilization, Infinity);
  assert.equal(result.state, "offline");
});

test("the illustrative cache still serves its hits when the origin is offline", () => {
  const result = calculateSystem({
    traffic: 300,
    replicas: 1,
    failed: true,
    cache: true,
  });
  assert.equal(result.demand, 180);
  assert.equal(result.served, 120);
  assert.equal(result.dropped, 180);
  assert.equal(result.utilization, Infinity);
  assert.equal(result.state, "offline");
  assert.match(result.message, /Cache serves 120 rps/);
});

test("state boundaries are healthy below 80%, strained through 100%, then overloaded", () => {
  for (const [traffic, state] of [
    [95.999, "healthy"],
    [96, "strained"],
    [96.001, "strained"],
    [119.999, "strained"],
    [120, "strained"],
    [120.001, "overloaded"],
  ]) {
    assert.equal(calculateSystem({ traffic, replicas: 1 }).state, state);
  }
});

test("cache uses origin demand, not incoming traffic, for state boundaries", () => {
  assert.equal(
    calculateSystem({ traffic: 160, replicas: 1, cache: true }).state,
    "strained",
  );
  assert.equal(
    calculateSystem({ traffic: 200, replicas: 1, cache: true }).dropped,
    0,
  );
  assert.equal(
    calculateSystem({ traffic: 200.001, replicas: 1, cache: true }).state,
    "overloaded",
  );
});

test("traffic and replica counts clamp at supported boundaries", () => {
  for (const traffic of [-1000, 0, 49.99, 50]) {
    assert.equal(calculateSystem({ traffic }).demand, 50);
  }
  for (const traffic of [600, 600.01, 1000000]) {
    assert.equal(calculateSystem({ traffic }).demand, 600);
  }
  for (const replicas of [-100, 0, 0.9, 1]) {
    assert.equal(calculateSystem({ replicas }).healthyReplicas, 1);
  }
  for (const replicas of [4, 4.1, 100]) {
    assert.equal(calculateSystem({ replicas }).healthyReplicas, 4);
  }
});

test("fractional replicas round while fractional request rates are preserved", () => {
  assert.equal(calculateSystem({ replicas: 2.49 }).healthyReplicas, 2);
  assert.equal(calculateSystem({ replicas: 2.5 }).healthyReplicas, 3);
  assert.equal(calculateSystem({ traffic: 250.25 }).demand, 250.25);
});

test("nonempty numeric form strings normalize without coercing objects", () => {
  assert.deepEqual(
    calculateSystem({ traffic: " 300 ", replicas: "4", failed: true }),
    calculateSystem({ traffic: 300, replicas: 4, failed: true }),
  );
  assert.equal(calculateSystem({ traffic: "700" }).demand, 600);
  const hostile = {
    valueOf() {
      throw new Error("Object coercion must not run");
    },
  };
  assert.deepEqual(
    calculateSystem({ traffic: hostile, replicas: hostile }),
    calculateSystem(),
  );
});

test("invalid numeric values fall back safely to documented defaults", () => {
  for (const value of [
    undefined,
    null,
    NaN,
    Infinity,
    -Infinity,
    "",
    "   ",
    "nope",
    "Infinity",
    true,
    false,
    [],
    {},
    Symbol("invalid"),
    300n,
  ]) {
    assert.deepEqual(
      calculateSystem({ traffic: value, replicas: value }),
      calculateSystem(),
    );
  }
});

test("missing or malformed settings use defaults", () => {
  for (const value of [undefined, null, 42, "bad", false, [], Symbol("bad")]) {
    assert.deepEqual(calculateSystem(value), calculateSystem());
  }
});

test("only true, not truthy strings or values, enables failure or cache", () => {
  for (const value of ["false", "true", 1, -1, {}, [], null, undefined]) {
    assert.deepEqual(
      calculateSystem({ failed: value, cache: value }),
      calculateSystem(),
    );
  }
});

test("the upper traffic boundary allows utilization well beyond 100%", () => {
  const result = calculateSystem({ traffic: 600, replicas: 1 });
  assert.equal(result.utilization, 500);
  assert.equal(result.served, 120);
  assert.equal(result.dropped, 480);
  assert.equal(result.state, "overloaded");
});

test("model is deterministic, input-pure, and independent of prior results", () => {
  const input = Object.freeze({
    traffic: 478.25,
    replicas: 3,
    failed: true,
    cache: true,
  });
  const original = { ...input };
  const first = calculateSystem(input);
  for (let iteration = 0; iteration < 100; iteration++) {
    assert.deepEqual(calculateSystem(input), first);
  }
  assert.deepEqual(input, original);
  assert.ok(Object.isFrozen(SYSTEM_DEFAULTS));
  const separate = calculateSystem(input);
  assert.notEqual(first, separate);
  separate.served = -1;
  assert.deepEqual(calculateSystem(input), first);
});

test("all legal snapshots conserve traffic and satisfy output invariants", () => {
  for (const traffic of [50, 50.1, 95.999, 96, 120, 200, 300, 479.9, 600]) {
    for (let replicas = 1; replicas <= 4; replicas++) {
      for (const failed of [false, true]) {
        for (const cache of [false, true]) {
          const result = calculateSystem({ traffic, replicas, failed, cache });
          assert.equal(result.healthyReplicas, replicas - Number(failed));
          assert.equal(result.capacity, result.healthyReplicas * 120);
          near(result.demand, traffic * (cache ? 0.6 : 1));
          near(result.cached, traffic * (cache ? 0.4 : 0));
          near(result.cached + result.demand, traffic);
          near(
            result.served,
            result.cached + Math.min(result.demand, result.capacity),
          );
          near(result.served + result.dropped, traffic);
          near(result.dropped, Math.max(0, result.demand - result.capacity));
          assert.ok(result.served >= 0 && result.served <= traffic);
          assert.ok(result.dropped >= 0 && result.dropped <= traffic);
          assert.ok(result.demand > 0 && result.demand <= traffic);
          assert.match(result.message, /^Illustrative simulation:/);
          assert.ok(result.message.length > 30);
          if (result.capacity === 0) {
            assert.equal(result.state, "offline");
            assert.equal(result.utilization, Infinity);
          } else {
            assert.ok(Number.isFinite(result.utilization));
            near(result.utilization, (result.demand / result.capacity) * 100);
            assert.equal(result.state === "overloaded", result.dropped > 0);
          }
        }
      }
    }
  }
});

test("adding replicas or enabling cache never worsens service", () => {
  for (const traffic of [50, 120, 300, 600]) {
    for (const failed of [false, true]) {
      for (let replicas = 1; replicas <= 4; replicas++) {
        const baseline = calculateSystem({ traffic, replicas, failed });
        const cached = calculateSystem({
          traffic,
          replicas,
          failed,
          cache: true,
        });
        assert.ok(cached.served >= baseline.served);
        assert.ok(cached.dropped <= baseline.dropped);
        assert.ok(cached.utilization <= baseline.utilization);
        if (replicas < 4) {
          const scaled = calculateSystem({
            traffic,
            replicas: replicas + 1,
            failed,
          });
          assert.ok(scaled.served >= baseline.served);
          assert.ok(scaled.dropped <= baseline.dropped);
          assert.ok(scaled.utilization <= baseline.utilization);
        }
      }
    }
  }
});
