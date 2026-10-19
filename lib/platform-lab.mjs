/**
 * An intentionally simplified, deterministic teaching model, not production
 * capacity planning or live portfolio metrics. Every healthy origin replica can
 * handle 120 requests/second. Optional cache hits bypass the origin entirely.
 */
export const CAPACITY_PER_REPLICA = 120;
export const CACHE_HIT_RATE = 0.4;

export const SYSTEM_DEFAULTS = Object.freeze({
  traffic: 300,
  replicas: 3,
  failed: false,
  cache: false,
});

function boundedNumber(value, fallback, minimum, maximum) {
  // Accept nonempty numeric form values, but never coerce booleans or objects.
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;
  return Number.isFinite(number)
    ? Math.min(maximum, Math.max(minimum, number))
    : fallback;
}

const rateLabel = (value) => String(Number(value.toFixed(1)));

/**
 * Calculate a single illustrative snapshot without mutating the input.
 *
 * Traffic is clamped to 50–600 rps. Replica count is clamped to 1–4 and rounded
 * to the nearest integer. Missing/invalid numbers use SYSTEM_DEFAULTS. Only
 * boolean true enables failure/cache; for example, the string "false" does not.
 *
 * `demand` and `capacity` describe the origin. `served` and `dropped` describe
 * total client traffic, including `cached` hits. The independent cache remains
 * available even when the origin is offline in this simplified model. A failure
 * removes exactly one replica, which can be the sole replica. Utilization is an unbounded percent
 * and is Infinity when no origin capacity remains; consumers should display a
 * label such as "offline" rather than formatting Infinity as a gauge value.
 *
 * @param {{ traffic?: number|string, replicas?: number|string,
 *   failed?: boolean, cache?: boolean }} [input]
 * @returns {{ healthyReplicas: number, demand: number, capacity: number, cached: number,
 *   served: number, dropped: number, utilization: number,
 *   state: "healthy"|"strained"|"overloaded"|"offline", message: string }}
 */
export function calculateSystem(input = {}) {
  const settings = input && typeof input === "object" ? input : {};
  const traffic = boundedNumber(
    settings.traffic,
    SYSTEM_DEFAULTS.traffic,
    50,
    600,
  );
  const replicas = Math.round(
    boundedNumber(settings.replicas, SYSTEM_DEFAULTS.replicas, 1, 4),
  );
  const failed = settings.failed === true;
  const cache = settings.cache === true;
  const healthyReplicas = replicas - Number(failed);
  const demand = traffic * (cache ? 1 - CACHE_HIT_RATE : 1);
  const cached = traffic - demand;
  const capacity = healthyReplicas * CAPACITY_PER_REPLICA;
  const dropped = Math.max(0, demand - capacity);
  const served = traffic - dropped;
  const utilization = capacity === 0 ? Infinity : (demand / capacity) * 100;
  const state =
    capacity === 0
      ? "offline"
      : demand > capacity
        ? "overloaded"
        : demand >= capacity * 0.8
          ? "strained"
          : "healthy";

  let message;
  if (state === "offline") {
    message = cache
      ? `Illustrative simulation: the origin is offline. Cache serves ${rateLabel(served)} rps, but ${rateLabel(dropped)} rps still drop. Restore a replica or add one.`
      : "Illustrative simulation: the origin is offline and all requests drop. Restore a replica or add one.";
  } else if (state === "overloaded") {
    message = `Illustrative simulation: ${rateLabel(dropped)} rps exceed origin capacity. ${cache ? "Add a replica or reduce traffic" : "Add a replica, enable cache, or reduce traffic"}${failed ? ", or restore the failed replica" : ""}.`;
  } else if (state === "strained") {
    message = `Illustrative simulation: all ${rateLabel(traffic)} rps are served, but origin headroom is low. ${cache ? "Add capacity" : "Add capacity or enable cache"} before another traffic spike.`;
  } else {
    message = `Illustrative simulation: all ${rateLabel(traffic)} rps are served with origin headroom${failed ? ", even with one replica down" : ""}. ${cache ? "Cache keeps 40% of requests away from the origin." : "Try a traffic spike or a replica failure."}`;
  }

  return {
    healthyReplicas,
    demand,
    capacity,
    cached,
    served,
    dropped,
    utilization,
    state,
    message,
  };
}
