import assert from "node:assert/strict";import { handleLaborApi } from "../server/labor-api.js";
function call(path,method="GET"){let status,body,headers;const res={writeHead(s,h){status=s;headers=h},end(x){body=JSON.parse(x)}};const handled=handleLaborApi({url:path,method},res,new URL(path,"http://localhost").pathname);return {handled,status,body,headers}}
assert.equal(call("/api/v1/labor/vacancies").status,200);
assert.equal(call("/api/v1/labor/vacancies?q=designer").body.total,1);
assert.equal(call("/api/v1/labor/vacancies?q=absent").body.total,0);
assert.equal(call("/api/v1/labor/vacancies","POST").status,405);
assert.equal(call("/api/v1/labor/capabilities").body.applications,false);
assert.equal(call("/api/v1/labor/nope").status,404);
assert.equal(call("/other").handled,false);
console.log("labor api tests passed");