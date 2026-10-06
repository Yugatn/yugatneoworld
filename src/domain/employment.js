export const EMPLOYMENT_VERSION = "0.3";

const seedJobs = [
  { id:"job-1", title:"Content Moderator", company:"Symbiont Network", employerId:"company-symbiont", mode:"remote", skills:["moderation","communication"], location:"Remote", description:"Moderate community content and help maintain a healthy social environment." },
  { id:"job-2", title:"Video Editor", company:"Yugatn Media", employerId:"company-media", mode:"flexible", skills:["video","editing"], location:"Flexible", description:"Edit short-form and long-form video for the media layer of eWorld." },
  { id:"job-3", title:"Community Support", company:"eWorld", employerId:"company-symbiont", mode:"remote", skills:["support","communication"], location:"Remote", description:"Help users navigate the social world and resolve everyday issues." }
];

export function createEmploymentState(profile={}) {
  return {
    version: EMPLOYMENT_VERSION,
    resume: { visibility:"private", headline:"", skills:[], experience:[], education:[], projects:[] },
    workPreferences: { modes:["remote","flexible"], schedule:"flexible", availability:"open" },
    applications: [],
    jobs: seedJobs.map(job => ({...job, skills:[...job.skills]})),
    conversations: []
  };
}

export function getJobs(state, filters={}) {
  const query=(filters.query||"").trim().toLowerCase();
  return state.jobs.filter(job =>
    (!filters.mode || job.mode===filters.mode) &&
    (!filters.employerId || job.employerId===filters.employerId) &&
    (!query || [job.title,job.company,job.location,job.description,...job.skills].join(" ").toLowerCase().includes(query))
  );
}

export function getJob(state, jobId) {
  return state.jobs.find(job=>job.id===jobId) || null;
}

export function updateResume(state, patch={}) {
  state.resume={...state.resume,...patch};
  return state.resume;
}

export function applyToJob(state, jobId) {
  const job=getJob(state,jobId);
  if(!job) throw new Error("Unknown job");
  const existing=state.applications.find(app=>app.jobId===jobId);
  if(existing) return existing;
  const application={
    id:"application-"+Date.now(),
    jobId,
    employerId:job.employerId,
    status:"draft",
    resumeVisibility:state.resume.visibility,
    resumeSnapshot:{...state.resume,skills:[...state.resume.skills],experience:[...state.resume.experience],education:[...state.resume.education],projects:[...state.resume.projects]},
    createdAt:new Date().toISOString(),
    submittedAt:null
  };
  state.applications.push(application);
  return application;
}

export function submitApplication(state, applicationId) {
  const application=state.applications.find(app=>app.id===applicationId);
  if(!application) throw new Error("Unknown application");
  if(application.status==="submitted" || application.status==="review") return application;
  application.status="submitted";
  application.submittedAt=new Date().toISOString();
  return application;
}

export function openEmployerConversation(state, employerId, message="Hello. I would like to learn more about opportunities.") {
  const conversation={id:"conversation-"+Date.now(),employerId,message,status:"requested",createdAt:new Date().toISOString()};
  state.conversations.push(conversation);
  return conversation;
}
