import { useState } from "react";
import styles from "./EngineeringLoop.module.css";

const stages = [
  {
    name: "Build",
    symbol: "</>",
    title: "Make the complex feel simple.",
    detail:
      "Thoughtful interfaces. Repeatable workflows. A strong starting point.",
    command: "build --with-intent",
    output: "A good foundation is a feature.",
  },
  {
    name: "Secure",
    symbol: "◇",
    title: "Trust belongs in the design.",
    detail:
      "Small permissions. Clear boundaries. Security built in, not bolted on.",
    command: "verify --every-layer",
    output: "Make the safe path the easy path.",
  },
  {
    name: "Scale",
    symbol: "▦",
    title: "Keep the good things running.",
    detail:
      "Visible systems. Resilient platforms. Room for whatever comes next.",
    command: "ship --with-confidence",
    output: "Ready for change, not just traffic.",
  },
];

export default function EngineeringLoop() {
  const [active, setActive] = useState(0);
  const stage = stages[active];

  return (
    <div className={styles.panel}>
      <div className={styles.topline}>
        <span>THE ENGINEERING LOOP</span>
        <span className={styles.interactive}>EXPLORE BELOW</span>
      </div>
      <div
        className={styles.controls}
        role="group"
        aria-label="Explore the engineering loop"
      >
        {stages.map((item, index) => (
          <button
            type="button"
            key={item.name}
            aria-pressed={active === index}
            onClick={() => setActive(index)}
          >
            <span>0{index + 1}</span> {item.name}
          </button>
        ))}
      </div>
      <div className={styles.visual} aria-hidden="true">
        <div className={styles.orbit} />
        <div className={styles.core} key={stage.name}>
          <span className={styles.symbol}>{stage.symbol}</span>
          <span>{stage.name.toUpperCase()}</span>
        </div>
        <span className={styles.coordinate}>CODE → CLOUD → PEOPLE</span>
      </div>
      <div className={styles.description} aria-live="polite" aria-atomic="true">
        <h2>{stage.title}</h2>
        <p>{stage.detail}</p>
        <div className={styles.terminal}>
          <span aria-hidden="true">❯ </span>
          <code>{stage.command}</code>
          <span className={styles.output}>{stage.output}</span>
        </div>
      </div>
    </div>
  );
}
