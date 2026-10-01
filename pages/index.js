import Head from "next/head";
import CareerQuest from "../components/CareerQuest";
import { useState } from "react";
import styles from "../styles/Home.module.css";

const experience = [
  {
    company: "Fullscript",
    role: "Senior DevOps Engineer · DevSecOps",
    date: "2025 — Present",
    current: true,
    description:
      "Building the foundations for reliable, secure healthcare technology.",
    bullets: [
      "Built and operated EKS workloads supporting real-time platform features for thousands of concurrent users.",
      "Built OWASP-based vulnerability triage workflows and implemented GuardDuty malware scanning for S3 uploads.",
      "Delivered zero-downtime EKS ingress migrations and led on-call incident response.",
    ],
  },
  {
    company: "Fullscript",
    role: "Senior JavaScript Engineer",
    date: "2023 — 2025",
    description:
      "Connecting product engineering with performance and developer experience.",
    bullets: [
      "Consolidated React applications into a server-rendered Remix monorepo.",
      "Built automated Lighthouse monitoring and an AI-powered code review assistant.",
      "Mentored engineers and resolved performance regressions across critical user journeys.",
    ],
  },
  {
    company: "Canada Digital Service",
    role: "Senior Full-Stack Developer · Treasury Board Secretariat",
    date: "2021 — 2023",
    description:
      "Making government services more accessible, resilient, and useful.",
    bullets: [
      "Led end-to-end feature delivery for GC Forms with Next.js, TypeScript, Terraform, and AWS.",
      "Delivered accessible, bilingual features and re-architected a high-availability Python service.",
      "Led incident response, blameless retrospectives, and cross-team engineering standards.",
    ],
  },
  {
    company: "Employment and Social Development Canada",
    role: "Full-Stack Developer · Digital Technology Solutions",
    date: "2019 — 2021",
    description:
      "Built COVID-19 response systems, maintained the Benefits Finder, and led Alpha Site development and CI/CD.",
  },
  {
    company: "Canada School of Public Service",
    role: "Full-Stack Developer · Digital Academy",
    date: "2018 — 2019",
    description:
      "Managed AWS infrastructure and built a real-time NLP dashboard for instructor feedback.",
  },
  {
    company: "Health Canada",
    role: "Data Analyst",
    date: "2017 — 2018",
    description:
      "Built regulatory analysis tools and automated manual inspection and cost-recovery workflows.",
  },
];
const projects = [
  {
    type: "AWS & CLOUD ARCHITECTURE",
    title: "Cloud foundations that scale.",
    description:
      "Designing and operating AWS infrastructure with Terraform, managed services, and security built in — from application workloads to the platforms beneath them.",
    tags: ["AWS", "Terraform", "Cloud architecture"],
    visual: "platform",
    detail: "Reproducible infrastructure · Secure by design",
  },
  {
    type: "KUBERNETES & PLATFORM ENGINEERING",
    title: "Platforms teams can depend on.",
    description:
      "Building and running Kubernetes platforms on EKS, with repeatable delivery, reliable networking, and zero-downtime migrations that keep teams moving.",
    tags: ["Kubernetes", "EKS", "CI/CD"],
    visual: "review",
    detail: "Container orchestration · Developer experience",
  },
  {
    type: "MENTORSHIP & DEVELOPER PRODUCTIVITY",
    title: "Helping engineers do their best work.",
    description:
      "Mentoring engineers, removing delivery friction, and building tools and workflows that help teams ship confidently — with reliable systems that scale behind them.",
    tags: ["Mentorship", "Developer experience", "Automation"],
    visual: "forms",
    detail: "Stronger teams · Smoother delivery",
  },
];
const skills = [
  [
    "01",
    "Cloud & infrastructure",
    ["AWS", "Kubernetes / EKS", "Terraform", "Docker", "Lambda", "RDS"],
  ],
  [
    "02",
    "Security & reliability",
    [
      "OWASP",
      "GuardDuty",
      "Snyk",
      "Wiz",
      "Incident response",
      "Vulnerability management",
    ],
  ],
  [
    "03",
    "Delivery & observability",
    [
      "GitHub Actions",
      "GitLab CI",
      "Jenkins",
      "Prometheus",
      "Grafana",
      "Datadog",
      "Sentry",
    ],
  ],
  [
    "04",
    "Product engineering",
    [
      "Python",
      "TypeScript",
      "React",
      "Next.js",
      "Remix",
      "PostgreSQL",
      "GraphQL",
    ],
  ],
];
function Arrow() {
  return <span aria-hidden="true">↗</span>;
}
function ProjectVisual({ kind }) {
  if (kind === "platform")
    return (
      <div className={styles.diagram} aria-hidden="true">
        <div className={styles.diagramTop}>
          CLOUD INFRASTRUCTURE <span>● LIVE</span>
        </div>
        <div className={styles.cloudNode}>AWS / EKS</div>
        <div className={styles.connectors} />
        <div className={styles.nodeRow}>
          <span>INGRESS</span>
          <span>WORKLOADS</span>
          <span>SERVICES</span>
        </div>
        <div className={styles.signal}>
          {Array.from({ length: 16 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className={styles.diagramBottom}>Designed for continuity.</div>
      </div>
    );
  if (kind === "review")
    return (
      <div className={styles.codeWindow} aria-hidden="true">
        <div className={styles.windowBar}>
          <span>● ● ●</span> platform.yaml
        </div>
        <div className={styles.code}>
          <p>
            <b>kind:</b> Deployment
          </p>
          <p>replicas: 3</p>
          <p>
            <b>strategy:</b> RollingUpdate
          </p>
          <p>readinessProbe: enabled</p>
        </div>
        <div className={styles.reviewNote}>
          <span>✦</span>
          <div>
            Repeatable delivery.
            <br />
            <strong>Reliable operations.</strong>
          </div>
        </div>
      </div>
    );
  return (
    <div className={styles.formVisual} aria-hidden="true">
      <div className={styles.formTop}>
        Developer <strong>experience</strong>
        <span>ENABLE</span>
      </div>
      <div className={styles.formBody}>
        <span>Learn. Build. Ship.</span>
        <div />
        <div />
        <div className={styles.shortLine} />
        <p>
          Less friction. More momentum. <b>✓</b>
        </p>
      </div>
    </div>
  );
}
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <>
      <Head>
        <title>Omar Nasr — DevOps & Platform Engineer</title>
        <meta
          name="description"
          content="Omar Nasr is a senior DevOps and platform engineer in Ottawa. 8+ years building secure, resilient cloud infrastructure and thoughtful digital products."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0c141b" />
        <meta
          property="og:title"
          content="Omar Nasr — DevOps & Platform Engineer"
        />
        <meta
          property="og:description"
          content="Secure foundations. Reliable systems. Better developer experiences."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://omarnasr.ca" />
        <meta
          property="og:image"
          content="https://omarnasr.ca/social-card.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://omarnasr.ca" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.navWrap}>
          <a href="#" className={styles.brand} aria-label="Omar Nasr home">
            on<span>.</span>
          </a>
          <button
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "Close" : "Menu"}{" "}
            <span aria-hidden="true">{menuOpen ? "×" : "+"}</span>
          </button>
          <nav
            id="navigation"
            aria-label="Main navigation"
            className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}
          >
            <a href="#work" onClick={closeMenu}>
              Expertise
            </a>
            <a href="#experience" onClick={closeMenu}>
              Experience
            </a>
            <a href="#career-quest" onClick={closeMenu}>
              Play my career
            </a>
            <a href="#about" onClick={closeMenu}>
              About
            </a>
            <a className={styles.navContact} href="mailto:omar@omarnasr.ca">
              Let’s talk <Arrow />
            </a>
          </nav>
        </div>
      </header>
      <main id="main" className={styles.container}>
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.dot} /> OTTAWA, CANADA · SENIOR DEVOPS
              ENGINEER
            </p>
            <h1 id="hero-heading">
              Good software.
              <br />
              Solid foundations.
              <br />
              <span>Built to last.</span>
            </h1>
            <p className={styles.heroDescription}>
              I’m Omar — a DevOps and platform engineer turning complex systems
              into secure, reliable infrastructure that helps teams ship with
              confidence.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#work">
                Explore my expertise <span aria-hidden="true">↓</span>
              </a>
              <a className={styles.resumeLink} href="#experience">
                View experience <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className={styles.heroMeta}>
              <span>
                Currently at <strong>Fullscript</strong>
              </span>
              <span>8+ years of engineering</span>
            </div>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.orbit} />
            <div className={styles.orbitInner} />
            <div className={styles.artLabel}>FROM CODE TO CLOUD</div>
            <div className={styles.stack}>
              <div className={styles.layerTop}>
                <span>01 / BUILD</span>
                <strong>&lt; / &gt;</strong>
              </div>
              <div className={styles.layerMiddle}>
                <span>02 / SECURE</span>
                <strong>◇</strong>
              </div>
              <div className={styles.layerBottom}>
                <span>03 / SCALE</span>
                <strong>▦</strong>
              </div>
            </div>
            <div className={styles.artCaption}>
              <span className={styles.dot} /> ENGINEERED FOR RESILIENCE
            </div>
            <span className={styles.artCoordinate}>
              45.4215° N &nbsp; 75.6972° W
            </span>
          </div>
        </section>
        <div className={styles.trustStrip}>
          <span>EXPERIENCE ACROSS</span>
          <strong>Fullscript</strong>
          <strong>Canada Digital Service</strong>
          <strong>Government of Canada</strong>
        </div>
        <section
          id="work"
          className={styles.section}
          aria-labelledby="work-heading"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>01 / CORE EXPERTISE</p>
              <h2 id="work-heading">Engineering with impact.</h2>
            </div>
            <p>
              The infrastructure, platforms, and
              <br className={styles.desktopBreak} /> engineering practices I
              bring to every system.
            </p>
          </div>
          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <article className={styles.projectCard} key={project.title}>
                <ProjectVisual kind={project.visual} />
                <div className={styles.projectContent}>
                  <p className={styles.projectType}>{project.type}</p>
                  <h3>{project.title}</h3>
                  <p className={styles.projectDescription}>
                    {project.description}
                  </p>
                  <ul className={styles.tags} aria-label="Technologies">
                    {project.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <p className={styles.projectDetail}>{project.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <CareerQuest experience={experience} />
        <section
          id="experience"
          className={styles.section}
          aria-labelledby="experience-heading"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>02 / THE JOURNEY</p>
              <h2 id="experience-heading">Built on experience.</h2>
            </div>
            <p>
              From public-service products
              <br className={styles.desktopBreak} /> to the platforms that power
              them.
            </p>
          </div>
          <div className={styles.timeline}>
            {experience.map((job) => (
              <article key={job.company + job.date} className={styles.job}>
                <div className={styles.jobDate}>
                  <span>{job.date}</span>
                  {job.current && (
                    <span className={styles.currentBadge}>CURRENT</span>
                  )}
                </div>
                <div className={styles.jobContent}>
                  <h3>{job.company}</h3>
                  <p className={styles.jobRole}>{job.role}</p>
                  <p className={styles.jobDescription}>{job.description}</p>
                  {job.bullets && (
                    <ul>
                      {job.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section
          id="expertise"
          className={styles.section}
          aria-labelledby="expertise-heading"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>03 / THE TOOLKIT</p>
              <h2 id="expertise-heading">Depth where it matters.</h2>
            </div>
            <p>
              Hands-on across the stack.
              <br className={styles.desktopBreak} /> Focused on the bigger
              picture.
            </p>
          </div>
          <div className={styles.skillsGrid}>
            {skills.map(([n, title, items]) => (
              <article className={styles.skillCard} key={title}>
                <span className={styles.skillNumber}>{n}</span>
                <h3>{title}</h3>
                <ul className={styles.tags}>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
        <section
          id="about"
          className={`${styles.section} ${styles.about}`}
          aria-labelledby="about-heading"
        >
          <div>
            <p className={styles.eyebrow}>04 / BEHIND THE SYSTEMS</p>
            <h2 id="about-heading">
              An engineer.
              <br />A problem solver.
              <br />
              <span>Always learning.</span>
            </h2>
            <div className={styles.education}>
              <span>EDUCATION</span>
              <strong>B.Sc. General Science · Cum Laude</strong>
              <p>University of Ottawa · 2015–2018</p>
            </div>
          </div>
          <div className={styles.aboutCopy}>
            <p>
              I’ve spent my career at the intersection of product and
              infrastructure — building the applications people use and the
              systems they depend on.
            </p>
            <p>
              My background spans healthcare technology and Canadian public
              service. That range shapes how I work: accessibility matters,
              security belongs in the design, and reliability is a
              responsibility.
            </p>
            <p>
              I’m equally comfortable writing a production service, untangling
              an incident, or helping a teammate find a better way forward. The
              goal is always the same: make complex things work well, for the
              people who rely on them.
            </p>
            <a
              className={styles.textLink}
              href="https://www.linkedin.com/in/ott-omar-nasr/"
            >
              More about me on LinkedIn <Arrow />
            </a>
          </div>
        </section>
        <section className={styles.contact} aria-labelledby="contact-heading">
          <p className={styles.eyebrow}>LET’S CONNECT</p>
          <h2 id="contact-heading">
            Have a good problem?
            <br />
            <span>Let’s work through it.</span>
          </h2>
          <a className={styles.contactEmail} href="mailto:omar@omarnasr.ca">
            omar@omarnasr.ca <Arrow />
          </a>
          <p>
            Infrastructure, security, product engineering — or a good
            conversation.
          </p>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <a className={styles.brand} href="#" aria-label="Back to top">
            on<span>.</span>
          </a>
          <p>
            © {new Date().getFullYear()} Omar Nasr · Built with care in Ottawa.
          </p>
          <div>
            <a href="https://github.com/Moro-Code">
              GitHub <Arrow />
            </a>
            <a href="https://www.linkedin.com/in/ott-omar-nasr/">
              LinkedIn <Arrow />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
