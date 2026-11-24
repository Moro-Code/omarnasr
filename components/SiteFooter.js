import styles from "../styles/Home.module.css";
import { GITHUB_URL, LINKEDIN_URL } from "../lib/site.mjs";

function Arrow() {
  return (
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
  );
}

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <a className={styles.brand} href="#top" aria-label="on. Back to top">
          on<span>.</span>
        </a>
        <p>
          © {new Date().getFullYear()} Omar Nasr · Built with care in Ottawa.
        </p>
        <div>
          <a href={GITHUB_URL}>
            GitHub <Arrow />
          </a>
          <a href={LINKEDIN_URL}>
            LinkedIn <Arrow />
          </a>
        </div>
      </div>
    </footer>
  );
}
