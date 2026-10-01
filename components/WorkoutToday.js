import { useEffect, useState } from "react";
import {
  durationLabel,
  STRAVA_PROFILE,
  WORKOUT_TIME_ZONE,
  workoutDate,
} from "../lib/workouts.mjs";
import styles from "./WorkoutToday.module.css";

function FitnessIcon({ small = false }) {
  return (
    <svg
      width={small ? 24 : 40}
      height={small ? 24 : 40}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 20h14M9 12v16M13 9v22M27 9v22M31 12v16M5 16v8M35 16v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function WorkoutToday() {
  const [feed, setFeed] = useState(null);
  const [now, setNow] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    let busy = false;
    let lastDate = "";
    let controller;
    async function refresh() {
      if (busy || document.hidden) return;
      busy = true;
      const current = new Date();
      setNow(current);
      lastDate = workoutDate(current);
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch("/api/strava", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!disposed)
          setFeed(
            response.ok &&
              data.status === "ready" &&
              Array.isArray(data.workouts)
              ? data
              : { status: "unavailable" },
          );
      } catch {
        if (!disposed) setFeed({ status: "unavailable" });
      } finally {
        clearTimeout(timeout);
        busy = false;
      }
    }
    refresh();
    const poll = setInterval(refresh, 300000);
    const clock = setInterval(() => {
      const current = new Date();
      setNow(current);
      if (workoutDate(current) !== lastDate) refresh();
    }, 15000);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      controller?.abort();
      clearInterval(poll);
      clearInterval(clock);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [attempt]);

  const fresh =
    feed?.status === "ready" &&
    now &&
    feed.date === workoutDate(now) &&
    now - new Date(feed.checkedAt) < 10 * 60000;
  const loading = !feed;
  const workedOut = fresh && feed.didWorkout;
  const label = loading
    ? "Checking in…"
    : !fresh
      ? "Status unavailable"
      : workedOut
        ? "Yes. Work put in."
        : "Not yet today.";
  const dateLabel = now
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: WORKOUT_TIME_ZONE,
        month: "long",
        day: "numeric",
      }).format(now)
    : "Today";
  return (
    <section
      id="for-fun"
      className={styles.section}
      aria-labelledby="fun-heading"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>05 / OUTSIDE THE TERMINAL</p>
          <h2 id="fun-heading">What I do for fun.</h2>
        </div>
        <p>
          A little less screen time.
          <br />A little more time moving.
        </p>
      </div>
      <div className={styles.grid}>
        <div className={styles.intro}>
          <div className={styles.icon}>
            <FitnessIcon />
          </div>
          <h3>
            Chasing progress.
            <br />
            <span>One workout at a time.</span>
          </h3>
          <p>
            Working out is how I reset. I like the process: show up, put in the
            work, and get a little better. I track my workouts on Strava.
          </p>
          <a
            className={styles.stravaLink}
            href={STRAVA_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
          >
            Follow me on Strava <span aria-hidden="true">↗</span>
          </a>
          <div className={styles.decor} aria-hidden="true">
            {[28, 45, 33, 62, 48, 77, 65, 91, 72, 100, 84, 115].map(
              (height, i) => (
                <span key={i} style={{ height }} />
              ),
            )}
          </div>
          <p className={styles.caption}>THE GOAL: KEEP SHOWING UP.</p>
        </div>
        <div className={styles.dashboard}>
          <div className={styles.topline}>
            <span>THE DAILY CHECK-IN</span>
            <span>{dateLabel} · Ottawa</span>
          </div>
          <h3>Did Omar work out today?</h3>
          <div
            className={`${styles.status} ${workedOut ? styles.yes : fresh ? styles.notYet : styles.unknown}`}
            role="status"
            aria-live="polite"
          >
            <span className={styles.indicator} aria-hidden="true">
              {workedOut ? "✓" : fresh ? "—" : "·"}
            </span>
            <strong>{label}</strong>
          </div>
          <p className={styles.explanation}>
            {loading
              ? "Checking today’s public Strava activities."
              : !fresh
                ? "Today’s activity hasn’t been confirmed here. You can still catch up with me on Strava."
                : workedOut
                  ? `${feed.totals.count} public ${feed.totals.count === 1 ? "activity" : "activities"} logged today. Every session counts.`
                  : "No public activities logged on Strava today. The day’s not over yet."}
          </p>
          {fresh && (
            <dl className={styles.stats}>
              <div>
                <dt>Sessions</dt>
                <dd>{feed.totals.count}</dd>
              </div>
              <div>
                <dt>Moving time</dt>
                <dd>{durationLabel(feed.totals.durationSeconds)}</dd>
              </div>
              <div>
                <dt>Distance</dt>
                <dd>
                  {(feed.totals.distanceMetres / 1000).toFixed(1)}{" "}
                  <small>km</small>
                </dd>
              </div>
            </dl>
          )}
          <div className={styles.feedHeading}>
            <h4>Today’s workouts</h4>
            <span>Latest first</span>
          </div>
          {fresh && feed.workouts.length > 0 ? (
            <ul className={styles.workouts}>
              {feed.workouts.map((workout) => (
                <li key={workout.id}>
                  <span className={styles.workoutIcon}>
                    <FitnessIcon small />
                  </span>
                  <div>
                    <a
                      href={workout.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {workout.name} <span aria-hidden="true">↗</span>
                    </a>
                    <p>
                      {workout.sport} · {durationLabel(workout.durationSeconds)}
                      {workout.distanceMetres > 0
                        ? ` · ${(workout.distanceMetres / 1000).toFixed(2)} km`
                        : ""}
                    </p>
                  </div>
                  <time dateTime={workout.startedAt}>
                    {new Intl.DateTimeFormat("en-CA", {
                      timeZone: WORKOUT_TIME_ZONE,
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(workout.startedAt))}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <FitnessIcon small />
              <p>
                {loading
                  ? "Fetching the latest check-in…"
                  : fresh
                    ? "A fresh day, a clean slate."
                    : "The next update will appear here."}
              </p>
            </div>
          )}
          <div className={styles.footer}>
            <p>
              {fresh
                ? `Checked ${new Intl.DateTimeFormat("en-CA", { timeZone: WORKOUT_TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(new Date(feed.checkedAt))} · Ottawa time`
                : "Public activities only · Ottawa time"}
            </p>
            {fresh ? (
              <a
                href={STRAVA_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Strava ↗
              </a>
            ) : (
              !loading && (
                <button
                  type="button"
                  onClick={() => {
                    setFeed(null);
                    setAttempt((value) => value + 1);
                  }}
                >
                  Check again ↻
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
