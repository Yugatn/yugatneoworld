import assert from "node:assert/strict";import { handleLaborApi } from "../server/labor-api.js";
async function call(path,method="GET"){let status,body,headers;const res={writeHead(s,h){status=s;headers=h},end(x){body=JSON.parse(x)}};const handled=await handleLaborApi({url:path,method},res,new URL(path,"http://localhost").pathname);return {handled,status,body,headers}}
assert.equal((await call("/api/v1/labor/vacancies")).status,200);
assert.equal((await call("/api/v1/labor/vacancies?q=designer")).body.total,1);
assert.equal((await call("/api/v1/labor/vacancies?q=absent")).body.total,0);
assert.equal((await call("/api/v1/labor/vacancies","POST")).status,405);
assert.equal((await call("/api/v1/labor/capabilities")).body.applications,false);
assert.equal((await call("/api/v1/labor/nope")).status,404);
assert.equal((await call("/other")).handled,false);
console.log("labor api tests passed");