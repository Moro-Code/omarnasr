import { useEffect, useRef, useState } from "react";
import { currentSection, SITE_SECTIONS } from "../lib/site-navigation.mjs";
import styles from "./SiteNavigation.module.css";

export default function SiteNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const header = useRef(null);
  const menuButton = useRef(null);
  const activeSection = SITE_SECTIONS.find((section) => section.id === current);

  useEffect(() => {
    let frame = 0;
    const sections = SITE_SECTIONS.map(({ id }) =>
      document.getElementById(id),
    ).filter(Boolean);
    function update() {
      frame = 0;
      const readingLine =
        (header.current?.getBoundingClientRect().bottom ?? 88) + 48;
      const atBottom =
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2;
      setCurrent(
        currentSection(
          sections.map((section) => ({
            id: section.id,
            top: section.getBoundingClientRect().top,
          })),
          readingLine,
          atBottom,
        ),
      );
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    const observer = new ResizeObserver(schedule);
    sections.forEach((section) => observer.observe(section));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1101px)");
    function onResize(event) {
      const focused = document.activeElement;
      const navigation = header.current?.querySelector("nav");
      setMenuOpen(false);
      if (event.matches && focused === menuButton.current) {
        const link =
          navigation?.querySelector("a[aria-current]") ??
          navigation?.querySelector("a");
        link?.focus();
      } else if (!event.matches && navigation?.contains(focused)) {
        menuButton.current?.focus();
      }
    }
    desktop.addEventListener("change", onResize);
    return () => desktop.removeEventListener("change", onResize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function close() {
      setMenuOpen(false);
    }
    function onEscape(event) {
      if (event.key === "Escape") {
        close();
        menuButton.current?.focus();
      }
    }
    function onOutside(event) {
      if (!header.current?.contains(event.target)) close();
    }
    document.addEventListener("keydown", onEscape);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    window.addEventListener("hashchange", close);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
      window.removeEventListener("hashchange", close);
    };
  }, [menuOpen]);

  function navigate(event, id) {
    // Preserve normal modified-click and native hash/history behavior.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    setMenuOpen(false);
    const destination = document.getElementById(id);
    const heading = destination?.querySelector("h1, h2") ?? destination;
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    }
  }

  return (
    <header className={styles.header} ref={header} data-site-header>
      <div className={styles.inner}>
        <a
          href="#main"
          className={styles.brand}
          aria-label="Omar Nasr home"
          onClick={(event) => navigate(event, "main")}
        >
          on<span>.</span>
        </a>
        <button
          type="button"
          className={styles.toggle}
          ref={menuButton}
          aria-expanded={menuOpen}
          aria-controls="navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={styles.location} aria-hidden="true">
            {activeSection?.label ?? "Explore the portfolio"}
          </span>
          <span>{menuOpen ? "Close" : "Menu"}</span>
          <span className={styles.toggleIcon} aria-hidden="true">
            {menuOpen ? "−" : "+"}
          </span>
        </button>
        <nav
          id="navigation"
          aria-label="Main navigation"
          className={`${styles.nav} ${menuOpen ? styles.open : ""}`}
        >
          <p className={styles.caption}>
            FIND YOUR WAY <span>08 SECTIONS / YOUR PACE</span>
          </p>
          <ol>
            {SITE_SECTIONS.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={current === section.id ? "location" : undefined}
                  className={
                    section.id === "contact" ? styles.contact : undefined
                  }
                  onClick={(event) => navigate(event, section.id)}
                >
                  <span className={styles.number} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.copy}>
                    <span className={styles.label}>{section.label}</span>
                    <span className={styles.detail}>{section.detail}</span>
                  </span>
                  <span className={styles.marker} aria-hidden="true">
                    {current === section.id ? (
                      "●"
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        focusable="false"
                      >
                        <path
                          d="M8 3v10M4 9l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <noscript>
        <style>{`@media (max-width:1100px) {
          [data-site-header] { position:relative; }
          [data-site-header] > div { height:auto; flex-wrap:wrap; padding-top:16px; }
          [data-site-header] button { display:none; }
          [data-site-header] nav { display:block; position:static; width:100%; max-height:none; border:0; padding:16px 0; }
        }`}</style>
      </noscript>
    </header>
  );
}
