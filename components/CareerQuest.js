import { useEffect, useRef, useState } from "react";
import styles from "./CareerQuest.module.css";

// Challenges are illustrative; the unlocked career facts come from the timeline.
const missions = [
  {
    name: "Automate the repeatable",
    badge: "Automation",
    icon: "01",
    prompt:
      "A team spends hours repeating the same inspection and reporting steps. What would you build first?",
    options: [
      "A bigger spreadsheet to maintain by hand",
      "An automated workflow with checks on the results",
      "A new dashboard before understanding the process",
    ],
    answer: 1,
    hint: "Look for a way to remove repetitive work while keeping the results trustworthy.",
    lesson:
      "Automation gives people time back. Understanding the workflow comes before choosing the tool.",
  },
  {
    name: "Close the feedback loop",
    badge: "Cloud foundations",
    icon: "02",
    prompt:
      "Instructors need to understand learner feedback while a course is running. Which approach helps them act sooner?",
    options: [
      "Wait for an end-of-year report",
      "Collect feedback without making it visible",
      "Turn incoming feedback into a live dashboard",
    ],
    answer: 2,
    hint: "The useful signal is the one people can see in time to act on it.",
    lesson:
      "A useful platform connects reliable infrastructure with information people can act on.",
  },
  {
    name: "Ship under pressure",
    badge: "Continuous delivery",
    icon: "03",
    prompt:
      "A public-service team needs to deliver urgent changes. How do you make frequent releases more dependable?",
    options: [
      "Automate build checks and deployment steps",
      "Make every release a different manual process",
      "Save every change for one enormous release",
    ],
    answer: 0,
    hint: "Repeatable steps help a team move quickly without depending on memory.",
    lesson:
      "Good delivery workflows make the safe path easier to follow, especially when the pressure is on.",
  },
  {
    name: "Build for the public",
    badge: "Accessible systems",
    icon: "04",
    prompt:
      "You are building a form used across government. What belongs in the design from the start?",
    options: [
      "Only the fastest path for the most common user",
      "Accessible, bilingual journeys and resilient services",
      "Visual polish first; access needs can wait",
    ],
    answer: 1,
    hint: "Public services need to work for people with different languages, devices, and access needs.",
    lesson:
      "Accessibility and reliability are part of the product, from the interface to the infrastructure.",
  },
  {
    name: "Multiply the team’s impact",
    badge: "Developer productivity",
    icon: "05",
    prompt:
      "Engineers keep hitting the same review and performance bottlenecks. Where would you invest?",
    options: [
      "Keep all the expertise with one senior engineer",
      "Add more manual approval steps to every change",
      "Mentor the team and automate useful feedback",
    ],
    answer: 2,
    hint: "The strongest improvement helps every engineer get better feedback and build confidence.",
    lesson:
      "Mentorship and good tools compound: stronger engineers, clearer feedback, and less delivery friction.",
  },
  {
    name: "Keep the platform moving",
    badge: "Platform reliability",
    icon: "06",
    prompt:
      "An AWS / Kubernetes platform needs an ingress migration while people are using it. What is the strongest plan?",
    options: [
      "Stage the change with health checks, observability, and a rollback path",
      "Switch all traffic at once and check the logs later",
      "Disable monitoring to reduce deployment noise",
    ],
    answer: 0,
    hint: "Think about how you will detect a problem, limit its impact, and recover.",
    lesson:
      "Building at scale means planning for change: secure foundations, visible system health, and reliable operations.",
  },
];

export default function CareerQuest({ experience }) {
  const [phase, setPhase] = useState("intro");
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState(null);
  const [firstTry, setFirstTry] = useState(0);
  const [retried, setRetried] = useState(false);
  const heading = useRef(null);
  const focusNext = useRef(false);
  const jobs = [...experience].reverse();
  const mission = missions[step];
  const job = jobs[step];
  const solved = phase === "playing" && choice === mission.answer;
  const earned = phase === "complete" ? missions.length : step + Number(solved);

  useEffect(() => {
    if (focusNext.current) {
      heading.current?.focus();
      focusNext.current = false;
    }
  }, [phase, step]);

  function start() {
    focusNext.current = true;
    setStep(0);
    setChoice(null);
    setFirstTry(0);
    setRetried(false);
    setPhase("playing");
  }

  function choose(index) {
    if (solved) return;
    setChoice(index);
    if (index === mission.answer) {
      if (!retried) setFirstTry((score) => score + 1);
    } else {
      setRetried(true);
    }
  }

  function next() {
    focusNext.current = true;
    if (step === missions.length - 1) {
      setPhase("complete");
    } else {
      setStep((value) => value + 1);
      setChoice(null);
      setRetried(false);
    }
  }

  return (
    <section
      id="career-quest"
      className={styles.quest}
      aria-labelledby="quest-title"
    >
      <div className={styles.introLine}>
        <div>
          <p className={styles.eyebrow}>AN INTERACTIVE DETOUR / ~2 MINUTES</p>
          <h2 id="quest-title">Play through my career.</h2>
        </div>
        <a href="#experience" className={styles.textLink}>
          Prefer the timeline? ↓
        </a>
      </div>
      <div className={styles.console}>
        <div className={styles.topBar}>
          <span>
            <span className={styles.liveDot} /> CAREER QUEST
          </span>
          <span>{earned} / 6 SKILLS UNLOCKED</span>
        </div>
        <div className={styles.layout}>
          <aside className={styles.map} aria-label="Career quest progress">
            <p className={styles.mapLabel}>THE PATH / 2017 → TODAY</p>
            <ol className={styles.stations}>
              {missions.map((item, index) => (
                <li
                  key={item.name}
                  className={`${styles.station} ${index < earned ? styles.earned : ""} ${phase === "playing" && index === step ? styles.active : ""}`}
                  aria-current={
                    phase === "playing" && index === step ? "step" : undefined
                  }
                >
                  <span className={styles.node} aria-hidden="true">
                    {index < earned ? "✓" : item.icon}
                  </span>
                  <div>
                    <span className={styles.date}>{jobs[index].date}</span>
                    <strong>{jobs[index].company}</strong>
                    <span>{item.badge}</span>
                  </div>
                  <span className={styles.srOnly}>
                    {index < earned ? "Unlocked" : "Not yet unlocked"}
                  </span>
                </li>
              ))}
            </ol>
          </aside>
          <div className={styles.stage}>
            {phase === "intro" && (
              <div className={styles.welcome}>
                <div className={styles.emblem} aria-hidden="true">
                  <span>&lt;/&gt;</span>
                  <span>→</span>
                  <span>☁</span>
                </div>
                <p className={styles.eyebrow}>
                  SIX ROLES. ONE BUILDING MINDSET.
                </p>
                <h3>
                  From first script
                  <br />
                  to systems at scale.
                </h3>
                <p>
                  Take the engineer’s seat. Make a call at each stop, collect
                  six skills, and discover the work behind my experience.
                </p>
                <div className={styles.rules}>
                  <span>6 quick missions</span>
                  <span>Unlimited retries</span>
                  <span>No timer</span>
                </div>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={start}
                >
                  Start the journey <span aria-hidden="true">→</span>
                </button>
                <p className={styles.finePrint}>
                  Illustrative challenges inspired by my roles. Real career
                  highlights unlocked along the way.
                </p>
              </div>
            )}
            {phase === "playing" && (
              <div>
                <p className={styles.eyebrow}>
                  MISSION {step + 1} / 6 · {mission.badge.toUpperCase()}
                </p>
                <h3 ref={heading} tabIndex={-1} className={styles.focusHeading}>
                  {mission.name}
                </h3>
                <p className={styles.role}>
                  {job.company} · {job.role} · {job.date}
                </p>
                <p className={styles.prompt} id="quest-prompt">
                  {mission.prompt}
                </p>
                <div
                  className={styles.choices}
                  role="group"
                  aria-labelledby="quest-prompt"
                >
                  {mission.options.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.choice} ${choice === index ? (solved ? styles.correct : styles.retry) : ""}`}
                      aria-disabled={solved}
                      aria-pressed={choice === index}
                      onClick={() => choose(index)}
                    >
                      <span className={styles.letter} aria-hidden="true">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
                <div aria-live="polite" aria-atomic="true">
                  {choice !== null && !solved && (
                    <p className={styles.hint}>
                      <strong>Another approach?</strong> {mission.hint} Try
                      again — no penalty for exploring.
                    </p>
                  )}
                  {solved && (
                    <div className={styles.unlock}>
                      <p className={styles.unlockLabel}>
                        ✓ {mission.badge} unlocked
                      </p>
                      <p>{mission.lesson}</p>
                      <h4>In my experience · {job.company}</h4>
                      <p>{job.description}</p>
                      {job.bullets && (
                        <ul>
                          {job.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                {solved && (
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={next}
                  >
                    {step === 5 ? "Finish the journey" : "Next mission"}{" "}
                    <span aria-hidden="true">→</span>
                  </button>
                )}
              </div>
            )}
            {phase === "complete" && (
              <div className={styles.welcome}>
                <p className={styles.eyebrow}>
                  JOURNEY COMPLETE / 6 OF 6 UNLOCKED
                </p>
                <h3 ref={heading} tabIndex={-1} className={styles.focusHeading}>
                  Good systems.
                  <br />
                  Stronger teams.
                </h3>
                <p>
                  From automating manual work to running AWS and Kubernetes
                  platforms, the thread is the same: make complex things work
                  well, and help people do their best work.
                </p>
                <ul className={styles.badges} aria-label="Unlocked skills">
                  {missions.map((item) => (
                    <li key={item.badge}>✓ {item.badge}</li>
                  ))}
                </ul>
                <p className={styles.score}>
                  {firstTry} / 6 missions solved on the first try. Every skill
                  unlocked.
                </p>
                <div className={styles.actions}>
                  <a className={styles.primary} href="mailto:omar@omarnasr.ca">
                    Let’s build something ↗
                  </a>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={start}
                  >
                    Play again ↺
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
