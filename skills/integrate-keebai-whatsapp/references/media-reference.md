# Media Reference

`client.media.*` — upload, get, delete and download files for WhatsApp.

## Pattern: upload once, send many times

Uploaded media is reusable for ~30 days. Prefer this pattern over passing public URLs when you'll send the same asset to many recipients:

```ts
import { readFile } from "node:fs/promises";

const buffer = await readFile("logo.png");
const file = new Blob([buffer], { type: "image/png" });

const { id: mediaId } = await wa.media.upload({
  file,
  fileName: "logo.png",
  type: "image/png",
});

for (const phone of recipients) {
  await wa.messages.sendImage({
    to: phone,
    image: { id: mediaId, caption: "Our logo" },
  });
}
```

---

## `upload`

```ts
upload(input: {
  file: Blob;
  fileName: string;
  type: string;            // MIME, e.g. "image/png", "video/mp4", "application/pdf"
  phoneNumberId?: string;
}): Promise<{ id: string }>
```

Max file size depends on Meta's limits per type (5 MB images, 16 MB video/audio, 100 MB document at the time of writing). Keebai enforces a 100 MB upper bound on the multipart request.

Node.js (no DOM `Blob`):

```ts
import { readFile } from "node:fs/promises";

const buffer = await readFile("./video.mp4");
const file = new Blob([buffer], { type: "video/mp4" });

const { id } = await wa.media.upload({
  file,
  fileName: "video.mp4",
  type: "video/mp4",
});
```

Browser:

```ts
const file = fileInputElement.files![0];
const { id } = await wa.media.upload({
  file,
  fileName: file.name,
  type: file.type,
});
```

---

## `get`

Fetch metadata for an uploaded media:

```ts
get(input: {
  mediaId: string;
  phoneNumberId?: string;
}): Promise<{
  id: string;
  url: string;                  // signed Meta CDN URL, expires
  mimeType: string;
  fileSize: number;
  sha256?: string;
  messagingProduct?: string;
}>
```

```ts
const meta = await wa.media.get({ mediaId: "media_abc" });
console.log(meta.mimeType, meta.fileSize);
```

---

## `delete`

```ts
delete(input: {
  mediaId: string;
  phoneNumberId?: string;
}): Promise<void>
```

```ts
await wa.media.delete({ mediaId: "media_abc" });
```

---

## `download`

Download the binary contents. In Keebai mode the data is proxied through the public-api (no expired signed URLs to manage).

```ts
download(input: {
  mediaId: string;
  phoneNumberId?: string;
  as?: "blob" | "arraybuffer";   // default "blob"
}): Promise<Blob | ArrayBuffer>
```

```ts
// Save to disk in Node.js
import { writeFile } from "node:fs/promises";

const ab = await wa.media.download({ mediaId: "media_abc", as: "arraybuffer" });
await writeFile("downloaded.png", Buffer.from(ab as ArrayBuffer));
```

```ts
// Browser: trigger a download
const blob = await wa.media.download({ mediaId: "media_abc" });
const url = URL.createObjectURL(blob as Blob);
const a = document.createElement("a");
a.href = url;
a.download = "image.png";
a.click();
URL.revokeObjectURL(url);
```

---

## Supported MIME types

Common Meta-supported MIME types (the SDK passes them through; Meta enforces):

| Type | MIME |
|---|---|
| Image | `image/jpeg`, `image/png` |
| Video | `video/mp4`, `video/3gpp` |
| Audio | `audio/aac`, `audio/mp4`, `audio/mpeg`, `audio/amr`, `audio/ogg` (use `voice: true` for PTT — must be Opus codec) |
| Document | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`, `application/vnd.ms-excel`, `text/plain` |
| Sticker | `image/webp` (static and animated) |

Full list: [Meta Cloud API media docs](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media).

---

## Meta mode caveats

In `meta` mode the SDK calls Meta Graph API directly (`POST /{phone_number_id}/media` for upload, `GET /{media_id}` for metadata, signed URL for download). The download path goes to the Meta CDN with an `Authorization: Bearer` header — the signed URL is short-lived. The SDK handles this for you.

In Keebai mode all media endpoints proxy through `api.keebai.com/v1/media/*`. No expired URLs to manage.
