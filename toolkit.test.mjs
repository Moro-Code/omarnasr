import assert from "node:assert/strict";
import test from "node:test";
import { experience } from "./lib/experience.mjs";
import { getToolkitExamples, toolkit } from "./lib/toolkit.mjs";

test("the toolkit retains all four categories and 26 existing skills", () => {
  assert.deepEqual(
    toolkit.map(({ title }) => title),
    [
      "Cloud & infrastructure",
      "Security & reliability",
      "Delivery & observability",
      "Product engineering",
    ],
  );
  assert.deepEqual(
    toolkit.flatMap(({ items }) => items),
    [
      "AWS",
      "Kubernetes / EKS",
      "Terraform",
      "Docker",
      "Lambda",
      "RDS",
      "OWASP",
      "GuardDuty",
      "Snyk",
      "Wiz",
      "Incident response",
      "Vulnerability management",
      "GitHub Actions",
      "GitLab CI",
      "Jenkins",
      "Prometheus",
      "Grafana",
      "Datadog",
      "Sentry",
      "Python",
      "TypeScript",
      "React",
      "Next.js",
      "Remix",
      "PostgreSQL",
      "GraphQL",
    ],
  );
});

test("role and category anchors are stable, unique, and safe for fragment links", () => {
  assert.equal(experience.length, 6);
  for (const entries of [experience, toolkit]) {
    const ids = entries.map(({ id }) => id);
    assert.equal(new Set(ids).size, entries.length);
    for (const id of ids) assert.match(id, /^[a-z][a-z-]*$/);
  }
  assert.notEqual(experience[0].id, experience[1].id);
});

test("each group quotes two exact existing career highlights and links to its source", () => {
  for (const group of toolkit) {
    const examples = getToolkitExamples(group);
    assert.equal(examples.length, 2);
    for (const example of examples) {
      const job = experience.find(
        ({ id }) => example.href === `#experience-${id}`,
      );
      assert.ok(job, example.href);
      assert.equal(example.company, job.company);
      assert.equal(example.date, job.date);
      assert.ok(
        [job.description, ...(job.bullets || [])].includes(example.text),
      );
    }
  }
});

test("examples stay relevant if career highlight order is edited later", () => {
  const text = (id) =>
    getToolkitExamples(toolkit.find((group) => group.id === id))
      .map((example) => example.text)
      .join(" ");
  assert.match(text("cloud"), /EKS.*AWS/s);
  assert.match(text("security"), /OWASP.*incident response/s);
  assert.match(text("delivery"), /Lighthouse.*CI\/CD/s);
  assert.match(text("product"), /React.*Next\.js/s);
});

test("invalid references fail visibly rather than publishing an unsupported claim", () => {
  assert.throws(
    () =>
      getToolkitExamples({ id: "invalid", examples: [{ jobId: "missing" }] }),
    /Invalid toolkit career reference/,
  );
  assert.throws(
    () =>
      getToolkitExamples({
        id: "invalid",
        examples: [{ jobId: "fullscript-devops", bullet: 99 }],
      }),
    /Invalid toolkit career reference/,
  );
});
