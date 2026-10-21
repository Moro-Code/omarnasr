import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { currentSection, SITE_SECTIONS } from "./lib/site-navigation.mjs";

test("section registry includes every destination once, in document order", () => {
  assert.deepEqual(
    SITE_SECTIONS.map(({ id }) => id),
    [
      "work",
      "playground",
      "career-quest",
      "experience",
      "expertise",
      "about",
      "for-fun",
      "contact",
    ],
  );
  assert.equal(
    new Set(SITE_SECTIONS.map(({ id }) => id)).size,
    SITE_SECTIONS.length,
  );
  const sources = [
    "pages/index.js",
    "components/PlatformLab.js",
    "components/CareerQuest.js",
    "components/WorkoutToday.js",
  ]
    .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
    .join("\n");
  for (const section of SITE_SECTIONS) {
    assert.ok(
      sources.includes(`id="${section.id}"`),
      `Missing destination: ${section.id}`,
    );
    assert.ok(section.label && section.detail);
  }
});

test("hero has no falsely active section; boundary is inclusive", () => {
  const positions = [
    { id: "work", top: 130 },
    { id: "playground", top: 1000 },
  ];
  assert.equal(currentSection(positions, 129), null);
  assert.equal(currentSection(positions, 130), "work");
});

test("a tall section stays current until the next crosses the reading line", () => {
  assert.equal(
    currentSection(
      [
        { id: "experience", top: -1800 },
        { id: "expertise", top: 131 },
      ],
      130,
    ),
    "experience",
  );
  assert.equal(
    currentSection(
      [
        { id: "experience", top: -1801 },
        { id: "expertise", top: 130 },
      ],
      130,
    ),
    "expertise",
  );
});

test("short sections and reverse scrolling use document position, not visibility ratio", () => {
  const positions = [
    { id: "one", top: -500 },
    { id: "two", top: 90 },
    { id: "three", top: 150 },
  ];
  assert.equal(currentSection(positions, 130), "two");
  assert.equal(currentSection(positions, 89), "one");
});

test("page bottom selects the final section even if it cannot reach the reading line", () => {
  const positions = [
    { id: "for-fun", top: -600 },
    { id: "contact", top: 240 },
  ];
  assert.equal(currentSection(positions, 130), "for-fun");
  assert.equal(currentSection(positions, 130, true), "contact");
});

test("no mounted destinations is safe", () => {
  assert.equal(currentSection([], 130), null);
  assert.equal(currentSection([], 130, true), null);
});
