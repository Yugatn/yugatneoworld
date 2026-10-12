# Access control · Embeds · Bulletin board v0.1

## Create announcement with attachments

```js
import { createAnnouncement, postDisplay } from "./bulletin-board.js";

const result = createAnnouncement(world.bulletin, "teacher", world.access, {
  title: "Материалы к уроку",
  body: "Видео + таблица + презентация",
  authorName: "Анна",
  visibility: "public",
  pin: true,
  attachments: [
    { url: "https://youtu.be/VIDEO_ID", title: "Видео" },
    { url: "https://docs.google.com/document/d/ID/edit", title: "Конспект" },
    "https://docs.google.com/spreadsheets/d/ID/edit",
    "https://docs.google.com/presentation/d/ID/edit"
  ]
});
// result.ok, result.post, result.attachmentCount, result.skippedAttachments

const ui = postDisplay(result.post);
// ui.attachments[].iframeSrc | openUrl | canIframe
```

Also: `createPost(..., { embedUrls: [...] })`, `attachEmbedToPost`, `attachManyToPost`, `removeEmbedFromPost`.

Max **5** attachments per post (`MAX_ATTACHMENTS`).

Supported: YouTube, Google Docs / Sheets / Slides, generic https links.

## Roles (ACL)

See matrix in prior section: teacher/admin create bulletin; student views.

## Objects

- Living room **Bulletin board** · Study **School bulletin**
- Voice: «новое объявление» · «прикрепить видео» · «доска объявлений»
