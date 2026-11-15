import assert from "node:assert/strict";
import { getJobs, createResumeDraft } from "../src/domain/work.js";

const all = getJobs();
assert.ok(all.length > 0);
assert.ok(getJobs({ mode: "remote" }).every((item) => item.mode === "remote"));
assert.deepEqual(getJobs({ mode: "unknown" }), []);

const first = all[0];
const name = first.title;
first.title = "MUTATED";
first.skills.push("injected");
assert.equal(getJobs()[0].title, name);
assert.ok(!getJobs()[0].skills.includes("injected"));

const input = { name: "  Ada  ", headline: " Video editor ", skills: ["video", "  editing  ", "", 2] };
const resume = createResumeDraft(input);
assert.equal(resume.profile.name, "Ada");
assert.equal(resume.profile.headline, "Video editor");
assert.deepEqual(resume.profile.skills, ["video", "editing"]);
assert.equal(resume.visibility, "private");
assert.equal(resume.status, "draft");
input.skills.push("injected");
assert.ok(!resume.profile.skills.includes("injected"));

assert.equal(createResumeDraft(null).profile.name, "Guest");
assert.deepEqual(createResumeDraft({ skills: { bad: true } }).profile.skills, []);
console.log("work catalogue and draft tests passed");
