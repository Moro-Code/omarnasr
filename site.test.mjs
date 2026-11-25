import test from "node:test";
import assert from "node:assert/strict";
import {
  CAREER_START_YEAR,
  SITE_URL,
  SOCIAL_IMAGE,
  JOB_TITLE,
  earliestCareerYear,
  experiencePhrase,
  profileJsonLd,
  yearsOfExperience,
} from "./lib/site.mjs";
import nextConfig, {
  contentSecurityPolicy,
  documentHeaders,
  hostRedirects,
  REDIRECT_HOSTS,
} from "./next.config.mjs";

test("years of experience are counted from the 2017 start", () => {
  assert.equal(CAREER_START_YEAR, 2017);
  assert.equal(
    earliestCareerYear([{ date: "2025 — Present" }, { date: "2017 — 2018" }]),
    2017,
  );
  assert.equal(yearsOfExperience(new Date(2026, 10, 24), 2017), 9);
  assert.equal(experiencePhrase(new Date(2026, 10, 24), 2017), "9+ years");
});

test("structured data uses the www canonical profile", () => {
  const data = profileJsonLd();
  assert.equal(data["@type"], "ProfilePage");
  assert.equal(data.url, "https://www.omarnasr.ca/");
  assert.equal(data.mainEntity["@type"], "Person");
  assert.equal(data.mainEntity.name, "Omar Nasr");
  assert.equal(data.mainEntity.jobTitle, JOB_TITLE);
  assert.equal(data.mainEntity.worksFor.name, "Fullscript");
  assert.deepEqual(
    [
      data.mainEntity.address.addressLocality,
      data.mainEntity.address.addressRegion,
      data.mainEntity.address.addressCountry,
    ],
    ["Ottawa", "Ontario", "Canada"],
  );
  assert.deepEqual(data.mainEntity.sameAs, [
    "https://github.com/Moro-Code",
    "https://www.linkedin.com/in/ott-omar-nasr/",
    "https://www.strava.com/athletes/1519100743",
  ]);
  assert.equal(SITE_URL, "https://www.omarnasr.ca/");
  assert.equal(SOCIAL_IMAGE, "https://www.omarnasr.ca/social-card.png");
  assert.equal(JSON.stringify(data).includes("omarnasr.vercel.app"), false);
  assert.equal(JSON.stringify(data).includes("https://omarnasr.ca"), false);
});

test("apex and vercel.app hosts redirect to the www canonical origin", () => {
  const redirects = hostRedirects();
  assert.deepEqual(REDIRECT_HOSTS, ["omarnasr.ca", "omarnasr.vercel.app"]);
  for (const host of REDIRECT_HOSTS) {
    const rules = redirects.filter((rule) => rule.has[0].value === host);
    assert.equal(rules.length, 2);
    for (const rule of rules) {
      assert.equal(rule.permanent, true);
      assert.equal(
        rule.destination.startsWith("https://www.omarnasr.ca"),
        true,
      );
    }
  }
});

test("production document headers are strict and do not open CORS", () => {
  const headers = Object.fromEntries(
    documentHeaders("production").map((header) => [header.key, header.value]),
  );
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.match(headers["Permissions-Policy"], /camera=\(\)/);
  assert.match(headers["Permissions-Policy"], /microphone=\(\)/);
  assert.match(headers["Permissions-Policy"], /geolocation=\(\)/);
  const csp = contentSecurityPolicy("production");
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /script-src 'self'/);
  assert.equal(csp.includes("unsafe-inline"), false);
  assert.equal(csp.includes("unsafe-eval"), false);
  assert.equal(headers["Access-Control-Allow-Origin"], undefined);
  assert.match(contentSecurityPolicy("development"), /unsafe-inline/);
});

test("production turbopack build keeps scripts external under script-src self", () => {
  assert.equal(nextConfig.experimental.turbopackSharedRuntime, false);
});
