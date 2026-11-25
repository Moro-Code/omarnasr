import { publishedCaseStudies } from "../lib/case-studies.mjs";
import styles from "../styles/Home.module.css";

// Hidden until lib/case-studies.mjs contains a complete, sourced entry.
export default function CaseStudies({ studies }) {
  const published = publishedCaseStudies(studies);
  if (published.length === 0) return null;
  return (
    <section
      id="case-studies"
      className={styles.section}
      aria-labelledby="case-studies-heading"
    >
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>SELECTED WORK</p>
          <h2 id="case-studies-heading">Case studies.</h2>
        </div>
        <p>
          A few systems, in enough detail
          <br className={styles.desktopBreak} /> to show how the work was done.
        </p>
      </div>
      <div className={styles.caseList}>
        {published.map((study) => (
          <article key={study.title} className={styles.caseStudy}>
            <p className={styles.projectType}>{study.context}</p>
            <h3>{study.title}</h3>
            <p className={styles.jobRole}>{study.role}</p>
            <p>{study.problem}</p>
            <ul>
              {study.approach.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
            <p className={styles.projectDetail}>{study.outcome}</p>
            {study.tags?.length > 0 && (
              <ul className={styles.tags} aria-label="Technologies">
                {study.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
