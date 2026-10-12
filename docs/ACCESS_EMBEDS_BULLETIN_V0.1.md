# Access control · Embeds · Bulletin board v0.1

## Differentiated access (`src/domain/access-control.js`)

Roles: `guest` · `student` · `parent` · `teacher` · **`admin`**.

Resources: schedule, class, homework, presentation, bulletin, embed, school.settings.

Actions: view, create, edit, delete, assign, moderate, manage_roles.

| Role | Highlights |
|------|------------|
| student / parent | view schedule, homework, bulletin, embeds |
| teacher | + create/edit schedule, classes, homework, bulletin, embeds |
| **admin** | all actions on all resources |

API:

- `can(role, resource, action, accessState?, resourceId?)`
- `grant` / `revoke` — extra per-role grants
- `setResourceAcl(resourceId, { viewers, editors, deny })` — fine-grained

## Admin

- `enterSchoolMode({ role: "admin" })` or voice «я администратор»
- `?role=admin`
- Can moderate bulletin, manage role grants, delete any post/event

## Embeds (`src/domain/embeds.js`)

Supported attach + display:

| Type | Example |
|------|---------|
| YouTube | `youtube.com/watch?v=…`, `youtu.be/…`, `/embed/…`, shorts |
| Google Docs | `docs.google.com/document/d/ID` → `/preview` |
| Google Sheets | `…/spreadsheets/d/ID` → `/preview` |
| Google Slides | `…/presentation/d/ID` → `/embed` |

- `parseEmbedUrl(url)` → `{ type, embedUrl, sourceUrl, … }`
- `attachEmbed(state, { url, title })`
- `embedDisplay(embed)` → iframe-safe `iframeSrc` when available

TV / presentation board / laptop: capabilities `embed.view` / `embed.attach`.

## Bulletin board — доска объявлений (`src/domain/bulletin-board.js`)

- Objects: **Bulletin board** (living room), **School bulletin** (study)
- Posts: title, body, visibility (`public` · `students` · `teachers` · `staff` · `admin`), pin, embeds[]
- `createPost` requires `bulletin.create` (teacher/admin by default)
- Visibility filters list for each role
- Optional YouTube/Google links on post

## Voice

- доска объявлений / bulletin board → `bulletin.view`
- новое объявление → `bulletin.post`
- я администратор / admin mode → `school.admin`
- прикрепить видео / attach youtube → `embed.attach`

## Not in v0.1

- Server-side auth of admin
- Live Google OAuth / Drive picker
- Full iframe UI panel in canvas (domain + object hooks only)
