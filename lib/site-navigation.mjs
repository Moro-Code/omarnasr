export const SITE_SECTIONS = Object.freeze([
  { id: "work", label: "Expertise", detail: "The problems I work on" },
  {
    id: "playground",
    label: "Resilience Lab",
    detail: "Try a platform simulation",
  },
  {
    id: "career-quest",
    label: "Career Quest",
    detail: "An interactive career detour",
  },
  { id: "experience", label: "Experience", detail: "The full career timeline" },
  { id: "expertise", label: "Toolkit", detail: "Tools across the stack" },
  { id: "about", label: "About", detail: "The person behind the systems" },
  { id: "for-fun", label: "For fun", detail: "Life outside the terminal" },
  { id: "contact", label: "Let’s talk", detail: "Start a conversation" },
]);

// Use the last section to cross the reading line, not intersection ratios:
// a long timeline should remain current even when it is taller than the viewport.
export function currentSection(positions, readingLine, atBottom = false) {
  if (atBottom && positions.length) return positions.at(-1).id;
  let current = null;
  for (const section of positions) {
    if (section.top > readingLine) break;
    current = section.id;
  }
  return current;
}
