import { createEmploymentState } from "./employment.js";

export function createSocialIdentity(seed={}) {
  return {
    version:"0.1",
    subjectId:seed.subjectId || "local-guest",
    displayName:seed.displayName || "Guest",
    avatar:seed.avatar || "default",
    employment:createEmploymentState({name:seed.displayName || "Guest"})
  };
}

export function loadIdentity() {
  try {
    const raw=localStorage.getItem("eworld.identity");
    if(raw) return JSON.parse(raw);
  } catch {}
  const identity=createSocialIdentity();
  localStorage.setItem("eworld.identity",JSON.stringify(identity));
  return identity;
}

export function saveIdentity(identity) {
  localStorage.setItem("eworld.identity",JSON.stringify(identity));
  return identity;
}
