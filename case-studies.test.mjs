import test from "node:test";
import assert from "node:assert/strict";
import { caseStudies, publishedCaseStudies } from "./lib/case-studies.mjs";

const complete = {
  title: "Ingress migration",
  context: "Fullscript, 2025",
  role: "Senior DevOps Engineer",
  problem: "Traffic had to move without downtime.",
  approach: ["Stage the change", "Keep a rollback path"],
  outcome: "The migration finished with no dropped requests.",
  tags: ["EKS"],
};

test("case studies stay unpublished until an entry is complete", () => {
  assert.deepEqual(caseStudies, []);
  assert.deepEqual(publishedCaseStudies(caseStudies), []);
  assert.deepEqual(publishedCaseStudies(null), []);
  assert.deepEqual(publishedCaseStudies([{ ...complete, outcome: "  " }]), []);
  assert.deepEqual(publishedCaseStudies([{ ...complete, approach: [] }]), []);
  assert.deepEqual(publishedCaseStudies([complete]), [complete]);
});
