---
name: integrate-keebai-whatsapp
description: "Build WhatsApp integrations with Keebai end-to-end: send text, media, interactive messages and templates; upload/download media; schedule template broadcasts; receive events via webhooks. Two transport modes: directly to Meta Cloud API (accessToken) or through the Keebai platform (PAT). Use whenever the task involves @keebai/sdk, the Keebai public-api (api.keebai.com), pat_ tokens, phone_number_id, sending WhatsApp messages, or wiring up WhatsApp webhooks on Keebai."
---

# Integrate Keebai WhatsApp

This skill teaches an agent how to operate WhatsApp on Keebai end-to-end using `@keebai/sdk` and the Keebai public-api. Keep this file as the entry point; open files under `references/` only when you need the deep dive.

## Setup

Install the SDK once in the target project:

```bash
npm i @keebai/sdk
```

Set credentials in the environment:

```bash
export KEEBAI_API_KEY=pat_<hex64>        # from app.keebai.com (Settings → API tokens) or `keebai-cli auth`
export KEEBAI_PHONE_NUMBER_ID=<numeric>  # Meta phone_number_id of the connected WhatsApp Business number
export KEEBAI_BASE_URL=https://api.keebai.com/v1   # optional; default
```

Instantiate the client:

```ts
import { WhatsAppClient } from "@keebai/sdk";

const wa = new WhatsAppClient({
  apiKey: process.env.KEEBAI_API_KEY!,
  phoneNumberId: process.env.KEEBAI_PHONE_NUMBER_ID!,
});
```

If the user does not have a connected WhatsApp number yet, point them to the Keebai dashboard onboarding flow at `app.keebai.com` (WhatsApp embedded signup). Programmatic onboarding via PAT is not exposed yet.

See `references/getting-started.md` for a 5-minute end-to-end walkthrough.

## Two modes

| Mode | Credential | Backend | When to use |
|---|---|---|---|
| `keebai` (default) | `apiKey: pat_...` | `https://api.keebai.com/v1` | You're on the Keebai platform. Get multi-tenant routing, persistence, webhooks, dashboards, broadcasts. |
| `meta` | `accessToken: EAA...` | `https://graph.facebook.com/v21.0` | You own the WABA and access token, no Keebai platform involved. Loses `client.templates.*` CRUD and `sendBulk`. |

The client infers the mode from the credential. Same method names work in both. See `references/meta-direct-mode.md` for trade-offs.

## Send messages

All send methods return `Promise<{ messages: [{ id }], messagingProduct, raw }>`. They DO NOT create broadcast records — only `sendBulk` does that.

| Method | What it does |
|---|---|
| `client.messages.sendText({ to, body, previewUrl? })` | Free-form text in an open conversation |
| `client.messages.sendImage({ to, image: { link\|id, caption? } })` | JPG/PNG image |
| `client.messages.sendVideo({ to, video: { link\|id, caption? } })` | MP4 video |
| `client.messages.sendAudio({ to, audio: { link\|id, voice? } })` | Audio (PTT via `voice: true`) |
| `client.messages.sendDocument({ to, document: { link\|id, filename?, caption? } })` | PDF/DOCX/etc. |
| `client.messages.sendSticker({ to, sticker: { link\|id } })` | WebP sticker |
| `client.messages.sendLocation({ to, location: { latitude, longitude, name?, address? } })` | Geo pin |
| `client.messages.sendContacts({ to, contacts: [...] })` | One or more contact cards |
| `client.messages.sendReaction({ to, reaction: { messageId, emoji } })` | Emoji reaction to a previous message |
| `client.messages.markRead({ messageId, typingIndicator? })` | Mark a received message as read (optional typing) |
| `client.messages.sendInteractiveButtons({ to, bodyText, buttons })` | Up to 3 reply buttons |
| `client.messages.sendInteractiveList({ to, bodyText, buttonText, sections })` | Scrollable list with sections |
| `client.messages.sendInteractiveCtaUrl({ to, bodyText, parameters: { displayText, url } })` | Tappable URL button |
| `client.messages.sendInteractiveCatalogMessage({ to, bodyText, parameters })` | Product catalog message |
| `client.messages.sendTemplate({ to, templateName, language, variables? })` | Approved template with named variables |
| `client.messages.sendRaw({ body })` | Escape hatch — raw Graph API body |

Full signatures, response shapes and examples in `references/messages-reference.md`.

Interactive message details (button limits, list section sizes, CTA URL constraints) in `references/interactive-reference.md`.

## Send media

Upload once, reuse the `media_id` for many sends:

```ts
import { readFile } from "node:fs/promises";

const fileBuffer = await readFile("logo.png");
const file = new Blob([fileBuffer], { type: "image/png" });

const { id: mediaId } = await wa.media.upload({
  file,
  fileName: "logo.png",
  type: "image/png",
});

await wa.messages.sendImage({
  to: "+5491155555555",
  image: { id: mediaId, caption: "Our logo" },
});
```

`client.media.*` exposes `upload`, `get` (metadata), `delete`, `download` (`as: 'blob' | 'arraybuffer'`). Full reference in `references/media-reference.md`.

## Templates

Send an approved template with named variables (the Keebai convention — maps to Meta's `parameter_name`):

```ts
await wa.messages.sendTemplate({
  to: "+5491155555555",
  templateName: "order_confirmation",
  language: "es",
  variables: { nombre: "Lucio", monto: "1500" },
});
```

For positional variables (legacy templates), pass an array: `variables: ["Lucio", "1500"]`.

To build a fully-custom template payload (headers, buttons, flow tokens) use the helper:

```ts
import { buildTemplateSendPayload } from "@keebai/sdk";

const payload = buildTemplateSendPayload({
  name: "welcome",
  language: "es",
  body: [{ type: "text", text: "Lucio", parameterName: "nombre" }],
  buttons: [{ subType: "quick_reply", index: 0, payload: "GO" }],
});
```

Templates CRUD (Keebai mode only):

```ts
await wa.templates.list({ limit: 20 });
await wa.templates.create({ name, language, category, components });
await wa.templates.update(id, { components, category });
```

Full guide in `references/templates-reference.md`.

## Broadcasts (bulk)

`sendBulk` is the **only** Keebai operation that creates a broadcast record. Single sends never touch the broadcasts collection.

```ts
const { broadcastId } = await wa.messages.sendBulk({
  templateName: "march_promo",
  language: "es",
  campaignName: "March 2026",
  recipients: [
    { to: "+5491155555555", variables: { nombre: "Lucio" } },
    { to: "+5491166666666", variables: { nombre: "Ana" } },
  ],
});

const status = await wa.messages.getBulkStatus(broadcastId);
console.log(status.sent, status.failed, status.pending);
```

## Receive events (webhooks)

Subscribe a webhook endpoint via the Keebai public-api (PAT auth):

```bash
curl -X POST https://api.keebai.com/v1/webhooks \
  -H "Authorization: Bearer $KEEBAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your.app/keebai-webhook",
    "events": [
      "whatsapp.message.received",
      "whatsapp.message.delivered",
      "whatsapp.message.read",
      "whatsapp.message.failed"
    ]
  }'
```

Each delivery POSTs JSON to your URL with shape `{ event, data, timestamp }`. See `assets/webhook-message-received.example.json` and `assets/webhook-message-status.example.json` for canonical payloads, and `references/webhooks-reference.md` for the full event catalog and signature verification.

## Errors and retries

The SDK normalizes errors from both Keebai and Meta:

```ts
import { WhatsAppApiError, WhatsAppValidationError, WhatsAppTimeoutError } from "@keebai/sdk";

try {
  await wa.messages.sendText({ to: "+5491155555555", body: "hi" });
} catch (err) {
  if (err instanceof WhatsAppApiError) {
    console.log(err.status, err.code, err.message);
  }
}
```

429 + 5xx + network errors are retried with exponential backoff. Override with `retries: 0` for fail-fast. Full details in `references/errors-reference.md`.

## Scripts

The `scripts/` directory has 25 executable Node.js scripts covering the full SDK surface — one per method. Each reads `KEEBAI_API_KEY` + `KEEBAI_PHONE_NUMBER_ID` from env and takes `--arg value` flags. Common pattern: `node scripts/<name>.mjs --help`.

| Category | Scripts |
|---|---|
| Messages — basic | `send-text`, `send-image`, `send-video`, `send-audio`, `send-document`, `send-sticker`, `send-location`, `send-contacts` |
| Messages — interactive | `send-interactive-buttons`, `send-interactive-list`, `send-interactive-cta-url`, `send-interactive-catalog` |
| Messages — templates & meta | `send-template`, `send-reaction`, `mark-read`, `send-raw` |
| Bulk | `send-bulk`, `get-bulk-status` |
| Media | `upload-media`, `get-media`, `delete-media`, `download-media` |
| Templates CRUD | `list-templates`, `create-template`, `update-template` |

Install the scripts' dependencies once:

```bash
cd skills/integrate-keebai-whatsapp && npm install
```

Then run any script directly:

```bash
node scripts/send-text.mjs --to +5491155555555 --text "Hola desde Keebai"
node scripts/send-template.mjs --to +5491155555555 --name welcome_v2 --language es --variables '{"nombre":"Lucio"}'
node scripts/upload-media.mjs --file ./logo.png --type image/png
```

Every script prints the JSON response to stdout. Pass `--help` to see flags.

## References

Open these only when you need the deep dive — keep context lean otherwise.

- [`references/getting-started.md`](references/getting-started.md) — 5-minute walkthrough from PAT to first message.
- [`references/messages-reference.md`](references/messages-reference.md) — every `client.messages.*` method, full TypeScript signatures, examples.
- [`references/media-reference.md`](references/media-reference.md) — upload/get/delete/download patterns, MIME support, upload-once-send-many.
- [`references/templates-reference.md`](references/templates-reference.md) — variables (named/positional), helper, CRUD, header & button types.
- [`references/interactive-reference.md`](references/interactive-reference.md) — buttons / list / cta_url / catalog limits and shapes.
- [`references/webhooks-reference.md`](references/webhooks-reference.md) — event catalog, payload shapes, signature verification, handler example.
- [`references/errors-reference.md`](references/errors-reference.md) — error class hierarchy, retry policy, recommended handling.
- [`references/meta-direct-mode.md`](references/meta-direct-mode.md) — when to use Meta mode, what you lose vs Keebai mode.
- [`references/public-api-reference.md`](references/public-api-reference.md) — raw HTTP endpoint mapping for non-TypeScript callers (curl, Python, Go, etc.).
