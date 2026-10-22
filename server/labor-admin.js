/** Pure administrative commands; caller must authenticate and authorize the actor. No public HTTP write routes. */
import {randomUUID} from "node:crypto";
import {validateSnapshot} from "./labor-store.js";
const roles=["organization_admin","recruiter"];
function required(s,min=1,max=160){return typeof s==="string"&&s.trim().length>=min&&s.length<=max}
export function applyLaborCommand(snapshot,actor,command){
 validateSnapshot(snapshot);
 if(!actor||!required(actor.id)||!required(actor.organizationId)||!roles.includes(actor.role)||actor.active!==true)throw Error("unauthorized");
 if(!command||!["vacancy.create","vacancy.update","vacancy.close"].includes(command.type))throw Error("unsupported_command");
 const organization=snapshot.organizations.find(o=>o.id===actor.organizationId);
 if(!organization||organization.status!=="verified")throw Error("organization_not_verified");
 const vacancies=snapshot.vacancies.map(v=>({...v}));
 if(command.type==="vacancy.create"){
  const v=command.vacancy;
  if(!v||v.organizationId!==actor.organizationId||!required(v.title,3,140)||!required(v.description,20,10000)||!required(v.location,1,160))throw Error("invalid_vacancy");
  const id=randomUUID();
  vacancies.push({id,organizationId:actor.organizationId,title:v.title.trim(),description:v.description.trim(),location:v.location.trim(),status:"draft"});
 }else{
  const index=vacancies.findIndex(v=>v.id===command.vacancyId&&v.organizationId===actor.organizationId);
  if(index<0)throw Error("vacancy_not_found");
  if(command.type==="vacancy.close")vacancies[index].status="closed";
  else{
   const patch=command.patch;
   if(!patch||Object.keys(patch).some(k=>!["title","description","location","status"].includes(k)))throw Error("invalid_patch");
   const v={...vacancies[index],...patch};
   if(!required(v.title,3,140)||!required(v.description,20,10000)||!required(v.location,1,160)||!["draft","open","closed"].includes(v.status))throw Error("invalid_vacancy");
   vacancies[index]=v;
  }
 }
 const next={...snapshot,vacancies};
 validateSnapshot(next);
 return {snapshot:next,event:{type:command.type,actorId:actor.id,organizationId:actor.organizationId,recordId:command.type==="vacancy.create"?vacancies[vacancies.length-1].id:command.vacancyId}};
}
