import assert from "node:assert/strict";
import {
  can,
  grant,
  revoke,
  setResourceAcl,
  isAdmin,
  listPermissions,
  createAccessState,
  summarizeAccess
} from "../src/domain/access-control.js";
import {
  parseYouTubeId,
  parseGoogleWorkspace,
  parseEmbedUrl,
  createEmbedsState,
  attachEmbed,
  listEmbeds,
  embedDisplay,
  summarizeEmbeds
} from "../src/domain/embeds.js";
import {
  createBulletinState,
  createPost,
  listPosts,
  deletePost,
  attachEmbedToPost,
  summarizeBulletin
} from "../src/domain/bulletin-board.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { enterSchoolMode, enterAsTeacher } from "../src/domain/school-mode.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 11);
const world = createDefaultWorld();
assert.ok(world.access);
assert.ok(world.embeds);
assert.ok(world.bulletin);
assert.ok(world.objects.some((o) => o.id === "bulletin-board"));
assert.ok(world.objects.some((o) => o.id === "study-bulletin"));

// —— ACL ——
assert.equal(isAdmin("admin"), true);
assert.equal(can("student", "schedule", "view"), true);
assert.equal(can("student", "schedule", "edit"), false);
assert.equal(can("teacher", "schedule", "assign"), true);
assert.equal(can("admin", "school.settings", "manage_roles"), true);
assert.equal(can("parent", "bulletin", "create"), false);
assert.equal(can("teacher", "bulletin", "create"), true);

const access = createAccessState();
// Grant parent ability to create bulletin
grant(access, "parent", "bulletin", "create");
assert.equal(can("parent", "bulletin", "create", access), true);
revoke(access, "parent", "bulletin", "create");
assert.equal(can("parent", "bulletin", "create", access), false);

setResourceAcl(access, "post_secret", { viewers: ["teacher", "admin"], editors: ["admin"] });
assert.equal(can("teacher", "bulletin", "view", access, "post_secret"), true);
assert.ok(listPermissions("teacher").schedule.includes("edit"));
assert.ok(summarizeAccess("admin").includes("admin"));

// —— Embeds ——
assert.equal(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.equal(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.equal(parseYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");

const gdoc = parseGoogleWorkspace("https://docs.google.com/document/d/abc123XYZ/edit");
assert.equal(gdoc.type, "google_docs");
assert.equal(gdoc.fileId, "abc123XYZ");
const gsheet = parseGoogleWorkspace("https://docs.google.com/spreadsheets/d/sheet99/edit#gid=0");
assert.equal(gsheet.type, "google_sheets");
const gslides = parseGoogleWorkspace("https://docs.google.com/presentation/d/pres55/edit");
assert.equal(gslides.type, "google_slides");

const yt = parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ", "Demo");
assert.equal(yt.type, "youtube");
assert.ok(yt.embedUrl.includes("embed/dQw4w9WgXcQ"));
const doc = parseEmbedUrl("https://docs.google.com/document/d/abc123XYZ/edit");
assert.equal(doc.type, "google_docs");
assert.ok(doc.embedUrl.includes("/preview"));

const embState = createEmbedsState();
const a1 = attachEmbed(embState, { url: "https://youtu.be/dQw4w9WgXcQ", title: "Lesson video" });
assert.equal(a1.ok, true);
const a2 = attachEmbed(embState, {
  url: "https://docs.google.com/spreadsheets/d/sheet99/edit",
  title: "Grades"
});
assert.equal(a2.ok, true);
assert.equal(listEmbeds(embState).length, 2);
const disp = embedDisplay(a1.embed);
assert.equal(disp.canIframe, true);
assert.ok(summarizeEmbeds(embState).includes("youtube"));

const bad = attachEmbed(embState, { url: "not-a-url" });
assert.equal(bad.ok, false);

// —— Bulletin ——
const board = createBulletinState();
const denied = createPost(board, "student", access, { title: "Hi" });
assert.equal(denied.ok, false);

const ok = createPost(board, "teacher", access, {
  title: "Parent meeting Friday",
  body: "At 18:00 in aula",
  authorName: "Anna",
  visibility: "public",
  pin: true,
  embedUrls: ["https://youtu.be/dQw4w9WgXcQ"]
});
assert.equal(ok.ok, true);
assert.equal(ok.post.embeds.length, 1);
assert.equal(ok.post.pin, true);

const staffOnly = createPost(board, "admin", access, {
  title: "Staff note",
  visibility: "staff",
  authorName: "Admin"
});
assert.equal(staffOnly.ok, true);

const forStudent = listPosts(board, "student", access);
assert.ok(forStudent.some((p) => p.title.includes("Parent")));
assert.ok(!forStudent.some((p) => p.title === "Staff note"));

const forTeacher = listPosts(board, "teacher", access);
assert.ok(forTeacher.some((p) => p.title === "Staff note"));

const att = attachEmbedToPost(
  board,
  "teacher",
  access,
  ok.post.id,
  "https://docs.google.com/presentation/d/pres55/edit",
  "Slides"
);
assert.equal(att.ok, true);
assert.equal(ok.post.embeds.length, 2);

const delStudent = deletePost(board, "student", access, ok.post.id);
assert.equal(delStudent.ok, false);
const delAdmin = deletePost(board, "admin", access, ok.post.id);
assert.equal(delAdmin.ok, true);
assert.ok(summarizeBulletin(board).includes("post"));

// Admin enter school
const sm = world.schoolMode;
enterSchoolMode(sm, { role: "admin", schoolName: "School 1" });
assert.equal(sm.role, "admin");
enterAsTeacher(sm, { teacherId: "t1" });
assert.equal(sm.role, "teacher");

assert.equal(matchVoiceCommand("доска объявлений").id, "bulletin.view");
assert.equal(matchVoiceCommand("bulletin board").id, "bulletin.view");
assert.equal(matchVoiceCommand("я администратор").id, "school.admin");
assert.equal(matchVoiceCommand("прикрепить видео").id, "embed.attach");

console.log("access-embeds-bulletin tests OK");
