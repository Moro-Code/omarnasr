import { getToolkitExamples, toolkit } from "../lib/toolkit.mjs";
import styles from "./ToolkitExplorer.module.css";

export default function ToolkitExplorer() {
  return (
    <div>
      <p className={styles.intro}>
        <span aria-hidden="true">TOOLS → REAL WORK</span>
        Expand a category to see related career highlights.
      </p>
      <div className={styles.grid}>
        {toolkit.map((group) => (
          <article className={styles.card} key={group.id}>
            <div className={styles.heading}>
              <span className={styles.number} aria-hidden="true">
                {group.number}
              </span>
              <h3 id={`toolkit-${group.id}`}>{group.title}</h3>
            </div>
            <ul className={styles.tags} aria-label={`${group.title} toolkit`}>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <details className={styles.details}>
              <summary
                aria-labelledby={`toolkit-action-${group.id} toolkit-${group.id}`}
              >
                <span id={`toolkit-action-${group.id}`}>
                  See it in practice
                </span>
                <span className={styles.toggle} aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" focusable="false">
                    <path d="M3 8h10M8 3v10" stroke="currentColor" />
                  </svg>
                </span>
              </summary>
              <div className={styles.evidence}>
                <p className={styles.evidenceLabel}>
                  RELATED CAREER HIGHLIGHTS
                </p>
                <ul className={styles.examples}>
                  {getToolkitExamples(group).map((example) => (
                    <li key={example.href}>
                      <p>{example.text}</p>
                      <a href={example.href}>
                        <span>
                          {example.company}
                          <span className={styles.date}>{example.date}</span>
                        </span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path
                            d="M4 12 12 4M4 4h8v8"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className={styles.srOnly}> — view full role</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}
