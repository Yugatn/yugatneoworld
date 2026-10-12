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
  createAnnouncement,
  listPosts,
  deletePost,
  attachEmbedToPost,
  attachManyToPost,
  removeEmbedFromPost,
  postDisplay,
  normalizeAttachments,
  summarizeBulletin,
  MAX_ATTACHMENTS
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
grant(access, "parent", "bulletin", "create");
assert.equal(can("parent", "bulletin", "create", access), true);
revoke(access, "parent", "bulletin", "create");
assert.equal(can("parent", "bulletin", "create", access), false);

setResourceAcl(access, "post_secret", { viewers: ["teacher", "admin"], editors: ["admin"] });
assert.equal(can("teacher", "bulletin", "view", access, "post_secret"), true);
assert.ok(listPermissions("teacher").schedule.includes("edit"));
assert.ok(summarizeAccess("admin").includes("admin"));

// —— Embeds parse ——
assert.equal(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.equal(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
const gdoc = parseGoogleWorkspace("https://docs.google.com/document/d/abc123XYZ/edit");
assert.equal(gdoc.type, "google_docs");
const gsheet = parseGoogleWorkspace("https://docs.google.com/spreadsheets/d/sheet99/edit#gid=0");
assert.equal(gsheet.type, "google_sheets");
const gslides = parseGoogleWorkspace("https://docs.google.com/presentation/d/pres55/edit");
assert.equal(gslides.type, "google_slides");

const embState = createEmbedsState();
assert.equal(attachEmbed(embState, { url: "https://youtu.be/dQw4w9WgXcQ" }).ok, true);
assert.ok(listEmbeds(embState).length >= 1);
assert.ok(embedDisplay(listEmbeds(embState)[0]).canIframe);
assert.ok(summarizeEmbeds(embState).includes("youtube"));

// —— normalizeAttachments ——
const norm = normalizeAttachments([
  "https://youtu.be/dQw4w9WgXcQ",
  { url: "https://docs.google.com/document/d/abc123XYZ/edit", title: "Homework" },
  { url: "https://docs.google.com/spreadsheets/d/sheet99/edit", title: "Table" },
  "https://docs.google.com/presentation/d/pres55/edit",
  "not-valid-url-xyz"
]);
assert.equal(norm.embeds.length, 4);
assert.equal(norm.skipped.length, 1);
assert.ok(norm.embeds.some((e) => e.type === "youtube"));
assert.ok(norm.embeds.some((e) => e.type === "google_docs"));
assert.ok(norm.embeds.some((e) => e.type === "google_sheets"));
assert.ok(norm.embeds.some((e) => e.type === "google_slides"));

// —— createAnnouncement with multi attachments ——
const board = createBulletinState();
const denied = createPost(board, "student", access, { title: "Hi" });
assert.equal(denied.ok, false);

const ann = createAnnouncement(board, "teacher", access, {
  title: "Lesson materials",
  body: "Watch the video and open the sheet",
  authorName: "Anna",
  authorId: "t_anna",
  visibility: "public",
  pin: true,
  attachments: [
    { url: "https://youtu.be/dQw4w9WgXcQ", title: "Intro video" },
    { url: "https://docs.google.com/document/d/abc123XYZ/edit", title: "Notes" },
    "https://docs.google.com/spreadsheets/d/sheet99/edit",
    "https://docs.google.com/presentation/d/pres55/edit"
  ]
});
assert.equal(ann.ok, true);
assert.equal(ann.attachmentCount, 4);
assert.equal(ann.post.embeds.length, 4);
assert.equal(ann.post.pin, true);

const view = postDisplay(ann.post);
assert.equal(view.attachmentCount, 4);
assert.ok(view.attachments.every((a) => a.openUrl));
assert.ok(view.attachments.filter((a) => a.canIframe).length >= 3);

// add more via attachMany
const many = attachManyToPost(board, "teacher", access, ann.post.id, [
  "https://www.youtube.com/watch?v=aaaaaaaaaaa"
]);
assert.equal(many.ok, true);
assert.equal(many.attachmentCount, 5);

// limit
const over = attachEmbedToPost(
  board,
  "teacher",
  access,
  ann.post.id,
  "https://youtu.be/bbbbbbbbbbb"
);
assert.equal(over.ok, false);
assert.equal(over.reason, "limit");
assert.equal(MAX_ATTACHMENTS, 5);

// remove one
const embId = ann.post.embeds[0].id;
const rm = removeEmbedFromPost(board, "teacher", access, ann.post.id, embId);
assert.equal(rm.ok, true);
assert.ok(rm.post.embeds.length < 5);

const staffOnly = createPost(board, "admin", access, {
  title: "Staff note",
  visibility: "staff",
  authorName: "Admin"
});
assert.equal(staffOnly.ok, true);
const forStudent = listPosts(board, "student", access);
assert.ok(forStudent.some((p) => p.title.includes("Lesson")));
assert.ok(!forStudent.some((p) => p.title === "Staff note"));

assert.ok(summarizeBulletin(board).includes("with attachments"));

const delAdmin = deletePost(board, "admin", access, ann.post.id);
assert.equal(delAdmin.ok, true);

const sm = world.schoolMode;
enterSchoolMode(sm, { role: "admin", schoolName: "School 1" });
assert.equal(sm.role, "admin");
enterAsTeacher(sm, { teacherId: "t1" });
assert.equal(sm.role, "teacher");

assert.equal(matchVoiceCommand("доска объявлений").id, "bulletin.view");
assert.equal(matchVoiceCommand("новое объявление").id, "bulletin.post");
assert.equal(matchVoiceCommand("я администратор").id, "school.admin");
assert.equal(matchVoiceCommand("прикрепить видео").id, "embed.attach");

console.log("access-embeds-bulletin tests OK");
