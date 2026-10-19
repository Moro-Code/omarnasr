import { useState } from "react";
import { calculateSystem } from "../lib/platform-lab.mjs";
import styles from "./PlatformLab.module.css";

export default function PlatformLab() {
  const [traffic, setTraffic] = useState(150);
  const [replicas, setReplicas] = useState(2);
  const [cache, setCache] = useState(false);
  const [failed, setFailed] = useState(false);
  const system = calculateSystem({ traffic, replicas, cache, failed });
  const complete = traffic >= 300 && failed && system.dropped === 0;
  const stateLabels = {
    healthy: "Looking healthy",
    strained: "Getting busy",
    overloaded: "Over capacity",
    offline: "Origin offline",
  };

  function reset() {
    setTraffic(150);
    setReplicas(2);
    setCache(false);
    setFailed(false);
  }

  return (
    <section
      id="playground"
      className={styles.section}
      aria-labelledby="lab-heading"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>
            A LITTLE LESS SCROLLING. A LITTLE MORE DOING.
          </p>
          <h2 id="lab-heading">You’re on platform duty.</h2>
        </div>
        <p>
          Turn up the traffic. Break a server.
          <br />
          See what keeps the system standing.
        </p>
      </div>
      <div className={styles.lab}>
        <div className={styles.toolbar}>
          <span>
            <span className={styles.dot} /> THE RESILIENCE LAB
          </span>
          <span>SIMULATION / NO REAL SYSTEMS INVOLVED</span>
        </div>
        <div className={styles.layout}>
          <div className={styles.controls}>
            <div className={styles.challenge}>
              <span className={styles.challengeLabel}>YOUR MISSION</span>
              <h3>
                Keep 300 requests/sec moving.
                <br />
                Even when a server goes down.
              </h3>
              <p>There’s more than one way to build a little resilience.</p>
            </div>
            <div className={styles.control}>
              <label htmlFor="lab-traffic">
                Incoming traffic{" "}
                <strong>
                  {traffic} <span>req/s</span>
                </strong>
              </label>
              <input
                id="lab-traffic"
                type="range"
                min="50"
                max="600"
                step="50"
                value={traffic}
                onChange={(event) => setTraffic(Number(event.target.value))}
                aria-valuetext={`${traffic} requests per second`}
              />
              <div className={styles.rangeLabels} aria-hidden="true">
                <span>Quiet morning / 50</span>
                <span>Big launch / 600</span>
              </div>
            </div>
            <div className={`${styles.control} ${styles.controlRow}`}>
              <div>
                <span className={styles.controlLabel}>Server replicas</span>
                <p>120 req/s each</p>
              </div>
              <div
                className={styles.stepper}
                role="group"
                aria-label="Server replica count"
              >
                <button
                  type="button"
                  disabled={replicas === 1}
                  aria-label="Remove one server"
                  onClick={() => setReplicas((value) => Math.max(1, value - 1))}
                >
                  −
                </button>
                <output aria-live="polite" aria-label="Server replicas">
                  {replicas}
                </output>
                <button
                  type="button"
                  disabled={replicas === 4}
                  aria-label="Add one server"
                  onClick={() => setReplicas((value) => Math.min(4, value + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <div className={`${styles.control} ${styles.controlRow}`}>
              <div>
                <span className={styles.controlLabel}>Edge cache</span>
                <p>Serve 40% before the origin</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={cache}
                aria-label="Edge cache"
                className={styles.switch}
                onClick={() => setCache((value) => !value)}
              >
                <span />
                <span className={styles.switchText}>
                  {cache ? "ON" : "OFF"}
                </span>
              </button>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.failureButton}
                data-restoring={failed || undefined}
                onClick={() => setFailed((value) => !value)}
              >
                {failed ? "↻ Restore server" : "↯ Take one server down"}
              </button>
              <button type="button" className={styles.reset} onClick={reset}>
                Reset lab
              </button>
            </div>
          </div>
          <div className={styles.system}>
            <div className={styles.systemHeader}>
              <span>THE SYSTEM</span>
              <span className={styles[system.state]}>
                {stateLabels[system.state]}
              </span>
            </div>
            <div className={styles.diagram} aria-hidden="true">
              <div className={styles.trafficNode}>
                <span>INCOMING</span>
                <strong>
                  {traffic}
                  <small> req/s</small>
                </strong>
              </div>
              <div className={styles.connector} />
              <div
                className={`${styles.cacheNode} ${cache ? styles.cacheOn : ""}`}
              >
                {cache ? "EDGE CACHE · 40% SERVED" : "EDGE CACHE · BYPASSED"}
              </div>
              <div className={styles.connector} />
              <div className={styles.balancer}>LOAD BALANCER</div>
              <div className={styles.branchLine} />
              <div className={styles.servers}>
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className={`${styles.server} ${index >= replicas ? styles.absent : failed && index === replicas - 1 ? styles.failed : styles.online}`}
                  >
                    <span className={styles.serverLights}>● ● ●</span>
                    <strong>0{index + 1}</strong>
                    <span>
                      {index >= replicas
                        ? "SPARE"
                        : failed && index === replicas - 1
                          ? "DOWN"
                          : "READY"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <dl className={styles.metrics}>
              <div>
                <dt>Served / sec</dt>
                <dd>
                  {system.served}
                  <span> / {traffic}</span>
                </dd>
              </div>
              <div>
                <dt>Dropped / sec</dt>
                <dd className={system.dropped ? styles.warning : ""}>
                  {system.dropped}
                </dd>
              </div>
              <div>
                <dt>Healthy servers</dt>
                <dd>
                  {system.healthyReplicas}
                  <span> / {replicas}</span>
                </dd>
              </div>
            </dl>
            <div
              className={`${styles.feedback} ${complete ? styles.complete : ""}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <strong>
                {complete
                  ? "✓ Mission complete. That’s resilience."
                  : stateLabels[system.state]}
              </strong>
              <p>
                {complete
                  ? "A server is down, but every request is still being served. Try more traffic, or reset to find another solution."
                  : system.message}
              </p>
            </div>
          </div>
        </div>
        <p className={styles.disclaimer}>
          A deliberately simple model, not a benchmark. Each healthy server
          handles up to 120 requests/sec; the independent cache serves 40% when
          enabled. Real systems have more trade-offs.
        </p>
      </div>
    </section>
  );
}
