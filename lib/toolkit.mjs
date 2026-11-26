import { experience } from "./experience.mjs";

// References reuse the timeline's public copy instead of adding new claims.
export const toolkit = [
  {
    id: "cloud",
    number: "01",
    title: "Cloud & infrastructure",
    items: ["AWS", "Kubernetes / EKS", "Terraform", "Docker", "Lambda", "RDS"],
    examples: [
      { jobId: "fullscript-devops", bullet: 0 },
      { jobId: "canada-school-public-service" },
    ],
  },
  {
    id: "security",
    number: "02",
    title: "Security & reliability",
    items: [
      "OWASP",
      "GuardDuty",
      "Snyk",
      "Wiz",
      "Incident response",
      "Vulnerability management",
    ],
    examples: [
      { jobId: "fullscript-devops", bullet: 1 },
      { jobId: "canada-digital-service", bullet: 2 },
    ],
  },
  {
    id: "delivery",
    number: "03",
    title: "Delivery & observability",
    items: [
      "GitHub Actions",
      "GitLab CI",
      "Jenkins",
      "Prometheus",
      "Grafana",
      "Datadog",
      "Sentry",
    ],
    examples: [
      { jobId: "fullscript-javascript", bullet: 1 },
      { jobId: "esdc" },
    ],
  },
  {
    id: "product",
    number: "04",
    title: "Product engineering",
    items: [
      "Python",
      "TypeScript",
      "React",
      "Next.js",
      "Remix",
      "PostgreSQL",
      "GraphQL",
    ],
    examples: [
      { jobId: "fullscript-javascript", bullet: 0 },
      { jobId: "canada-digital-service", bullet: 0 },
    ],
  },
];

export function getToolkitExamples(group) {
  return group.examples.map(({ jobId, bullet }) => {
    const job = experience.find(({ id }) => id === jobId);
    const text =
      bullet === undefined ? job?.description : job?.bullets?.[bullet];

    if (!job || !text) {
      throw new Error(`Invalid toolkit career reference: ${group.id}/${jobId}`);
    }

    return {
      company: job.company,
      date: job.date,
      href: `#experience-${job.id}`,
      text,
    };
  });
}
