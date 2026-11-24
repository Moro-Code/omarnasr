/**
 * Case studies stay off the page until an entry is complete and real.
 * Push an object onto `caseStudies` to publish it. Incomplete drafts are
 * ignored. Do not add metrics, customers, or outcomes that are not sourced.
 *
 * {
 *   title: "Short name of the work",
 *   context: "Where and when, in plain language",
 *   role: "What Omar was responsible for",
 *   problem: "The constraint this work addressed",
 *   approach: ["Concrete step", "Another step"],
 *   outcome: "What changed, only with evidence you can stand behind",
 *   tags: ["Optional", "tools"],
 * }
 */
export const caseStudies = [];

const requiredText = ["title", "context", "role", "problem", "outcome"];

function filled(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function publishedCaseStudies(studies) {
  if (!Array.isArray(studies)) return [];
  return studies.filter((study) => {
    if (!study || typeof study !== "object") return false;
    if (!requiredText.every((field) => filled(study[field]))) return false;
    if (
      !Array.isArray(study.approach) ||
      study.approach.length === 0 ||
      !study.approach.every(filled)
    )
      return false;
    if (
      study.tags !== undefined &&
      (!Array.isArray(study.tags) || !study.tags.every(filled))
    )
      return false;
    return true;
  });
}
