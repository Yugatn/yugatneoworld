export const EMPLOYMENT_VERSION = "0.2";

const seedJobs = [
  { id:"job-1", title:"Content Moderator", company:"Symbiont Network", mode:"remote", skills:["moderation","communication"], location:"Remote" },
  { id:"job-2", title:"Video Editor", company:"Yugatn Media", mode:"flexible", skills:["video","editing"], location:"Flexible" },
  { id:"job-3", title:"Community Support", company:"eWorld", mode:"remote", skills:["support","communication"], location:"Remote" }
];

export function createEmploymentState(profile={}) {
  return {
    version: EMPLOYMENT_VERSION,
    resume: {
      visibility:"private",
      headline:"",
      skills:[],
      experience:[],
      education:[],
      projects:[]
    },
    workPreferences: { modes:["remote","flexible"], schedule:"flexible", availability:"open" },
    applications: [],
    jobs: seedJobs.map(job => ({...job, skills:[...job.skills]}))
  };
}

export function getJobs(state, filters={}) {
  const query=(filters.query||"").trim().toLowerCase();
  return state.jobs.filter(job =>
    (!filters.mode || job.mode===filters.mode) &&
    (!query || [job.title,job.company,job.location,...job.skills].join(" ").toLowerCase().includes(query))
  );
}

export function updateResume(state, patch={}) {
  state.resume={...state.resume,...patch};
  return state.resume;
}

export function applyToJob(state, jobId) {
  if(!state.jobs.some(job=>job.id===jobId)) throw new Error("Unknown job");
  if(state.applications.some(app=>app.jobId===jobId)) return state.applications.find(app=>app.jobId===jobId);
  const application={id:"application-"+Date.now(),jobId,status:"draft",createdAt:new Date().toISOString()};
  state.applications.push(application);
  return application;
}
