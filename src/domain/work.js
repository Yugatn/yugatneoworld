const jobs = [
  { id:"job-1", title:"Content Moderator", company:"Symbiont Network", mode:"remote", skills:["moderation","communication"] },
  { id:"job-2", title:"Video Editor", company:"Yugatn Media", mode:"flexible", skills:["video","editing"] },
  { id:"job-3", title:"Community Support", company:"eWorld", mode:"remote", skills:["support","communication"] }
];

export function getJobs(filters={}) {
  return jobs.filter(job => !filters.mode || job.mode === filters.mode);
}

export function createResumeDraft(profile={}) {
  return {
    version:"0.1",
    profile:{ name:profile.name || "Guest", headline:"", skills:[], experience:[], education:[] },
    visibility:"private",
    status:"draft"
  };
}
