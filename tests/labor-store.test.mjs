import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";import {tmpdir} from "node:os";import {join} from "node:path";
import {validateSnapshot,publicVacancies,loadLaborStore,saveLaborStore} from "../server/labor-store.js";
const sample={version:1,organizations:[{id:"org1",name:"Example Org",status:"verified"},{id:"org2",name:"Pending Org",status:"pending"}],vacancies:[{id:"job1",organizationId:"org1",title:"Accountant",description:"Prepare financial reports with Excel and 1C.",location:"Remote",status:"open"},{id:"job2",organizationId:"org2",title:"Designer",description:"Design learning environments and games.",location:"Remote",status:"open"}]};
assert.equal(publicVacancies(sample).length,1);
assert.equal(publicVacancies(sample,"excel").length,1);
assert.equal(publicVacancies(sample,"designer").length,0);
assert.throws(()=>validateSnapshot({...sample,vacancies:[{...sample.vacancies[0],organizationId:"missing"}]}),/referential_integrity/);
assert.throws(()=>validateSnapshot({...sample,organizations:[sample.organizations[0],sample.organizations[0]]}),/referential_integrity/);
const dir=await mkdtemp(join(tmpdir(),"yugatneo-labor-"));
try{const file=join(dir,"labor.json");assert.equal((await loadLaborStore(file)).vacancies.length,0);await saveLaborStore(file,sample);assert.deepEqual(await loadLaborStore(file),sample)}finally{await rm(dir,{recursive:true,force:true})}
console.log("labor store tests passed");
