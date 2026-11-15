/** Local demonstration catalogue; this module does not connect to real employers. */
const jobs = [
  { id: "job-1", title: "Content Moderator", company: "Symbiont Network", mode: "remote", skills: ["moderation", "communication"] },
  { id: "job-2", title: "Video Editor", company: "Yugatn Media", mode: "flexible", skills: ["video", "editing"] },
  { id: "job-3", title: "Community Support", company: "eWorld", mode: "remote", skills: ["support", "communication"] }
];

/** Read-only demo data: never leak mutable references to the catalogue. */
export function getJobs(filters = {}) {
  const options = filters && typeof filters === "object" ? filters : {};
  return jobs
    .filter((job) => !options.mode || job.mode === options.mode)
    .map((job) => ({ ...job, skills: [...job.skills] }));
}

function plainText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/** Private draft only; not an application to an employer or a verified CV. */
export function createResumeDraft(profile = {}) {
  const input = profile && typeof profile === "object" && !Array.isArray(profile) ? profile : {};
  const name = plainText(input.name, 80) || "Guest";
  const headline = plainText(input.headline, 160);
  const skills = Array.isArray(input.skills)
    ? input.skills
        .filter((item) => typeof item === "string")
        .map((item) => plainText(item, 64))
        .filter(Boolean)
        .slice(0, 40)
    : [];

  return {
    version: "0.1",
    profile: { name, headline, skills, experience: [], education: [] },
    visibility: "private",
    status: "draft"
  };
}
