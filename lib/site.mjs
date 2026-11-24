import { STRAVA_PROFILE } from "./workouts.mjs";

export const SITE_ORIGIN = "https://www.omarnasr.ca";
export const SITE_URL = `${SITE_ORIGIN}/`;
export const SOCIAL_IMAGE = `${SITE_ORIGIN}/social-card.png`;
export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;
export const SITE_NAME = "Omar Nasr";
export const SITE_TITLE = "Omar Nasr — DevOps & Platform Engineer";
export const JOB_TITLE = "DevOps & platform engineer";
export const SITE_LOCALE = "en_CA";
export const GITHUB_URL = "https://github.com/Moro-Code";
export const LINKEDIN_URL = "https://www.linkedin.com/in/ott-omar-nasr/";
export const SAME_AS = [GITHUB_URL, LINKEDIN_URL, STRAVA_PROFILE];

// First role in the timeline. The visible "N+ years" count is derived from this.
export const CAREER_START_YEAR = 2017;

export function earliestCareerYear(jobs, fallback = CAREER_START_YEAR) {
  const years = (jobs ?? [])
    .map((job) => Number(String(job?.date ?? "").slice(0, 4)))
    .filter((year) => Number.isInteger(year) && year > 1900);
  return years.length ? Math.min(...years) : fallback;
}

export function yearsOfExperience(
  now = new Date(),
  startYear = CAREER_START_YEAR,
) {
  return now.getFullYear() - startYear;
}

export function experiencePhrase(
  now = new Date(),
  startYear = CAREER_START_YEAR,
) {
  return `${yearsOfExperience(now, startYear)}+ years`;
}

export function profileJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: SITE_URL,
    mainEntity: {
      "@type": "Person",
      name: SITE_NAME,
      jobTitle: JOB_TITLE,
      worksFor: {
        "@type": "Organization",
        name: "Fullscript",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ottawa",
        addressRegion: "Ontario",
        addressCountry: "Canada",
      },
      url: SITE_URL,
      sameAs: SAME_AS,
    },
  };
}
