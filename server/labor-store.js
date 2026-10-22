/** File-backed prototype store. Not suitable for concurrent multi-instance production writes. */
import {readFile,writeFile,rename,mkdir} from "node:fs/promises";
import {dirname} from "node:path";
import {randomUUID} from "node:crypto";
const idPattern=/^[a-zA-Z0-9_-]{3,80}$/;
function validOrganization(o){return o && idPattern.test(o.id||"") && typeof o.name==="string" && o.name.trim().length>=2 && o.name.length<=160 && ["pending","verified","suspended"].includes(o.status);}
function validVacancy(v){return v && idPattern.test(v.id||"") && idPattern.test(v.organizationId||"") && typeof v.title==="string" && v.title.trim().length>=3 && v.title.length<=140 && typeof v.description==="string" && v.description.trim().length>=20 && v.description.length<=10000 && typeof v.location==="string" && v.location.length<=160 && ["draft","open","closed"].includes(v.status);}
export function validateSnapshot(snapshot){
 if(!snapshot || snapshot.version!==1 || !Array.isArray(snapshot.organizations) || !Array.isArray(snapshot.vacancies))throw Error("invalid_snapshot");
 if(snapshot.organizations.length>10000 || snapshot.vacancies.length>100000)throw Error("snapshot_too_large");
 if(!snapshot.organizations.every(validOrganization) || !snapshot.vacancies.every(validVacancy))throw Error("invalid_records");
 const orgs=new Set(snapshot.organizations.map(o=>o.id)), ids=new Set(snapshot.vacancies.map(v=>v.id));
 if(orgs.size!==snapshot.organizations.length || ids.size!==snapshot.vacancies.length || snapshot.vacancies.some(v=>!orgs.has(v.organizationId)))throw Error("referential_integrity");
 return snapshot;
}
export function publicVacancies(snapshot,q=""){
 const term=String(q).trim().toLocaleLowerCase().slice(0,100);
 const verified=new Map(snapshot.organizations.filter(o=>o.status==="verified").map(o=>[o.id,o]));
 return snapshot.vacancies.filter(v=>v.status==="open"&&verified.has(v.organizationId)&&(!term||[v.title,v.description,v.location,verified.get(v.organizationId).name].some(s=>s.toLocaleLowerCase().includes(term)))).map(v=>({id:v.id,organizationId:v.organizationId,organizationName:verified.get(v.organizationId).name,title:v.title,description:v.description,location:v.location,status:v.status,worldRoom:v.worldRoom||null}));
}
export async function loadLaborStore(path){
 try {return validateSnapshot(JSON.parse(await readFile(path,"utf8")))}
 catch(e){if(e.code==="ENOENT")return {version:1,organizations:[],vacancies:[]};throw e}
}
export async function saveLaborStore(path,snapshot){
 validateSnapshot(snapshot);
 await mkdir(dirname(path),{recursive:true});
 const temp=path+"."+randomUUID()+".tmp";
 await writeFile(temp,JSON.stringify(snapshot,null,2)+"\n",{encoding:"utf8",flag:"wx",mode:0o600});
 await rename(temp,path);
}
