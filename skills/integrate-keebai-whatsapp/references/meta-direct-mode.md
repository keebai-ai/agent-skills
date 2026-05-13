# Meta Direct Mode

`@keebai/sdk` also works against Meta Cloud API directly, no Keebai platform involved. Use this when:

- You own the WhatsApp Business Account and access token.
- You don't need Keebai's persistence, dashboards, webhooks normalization, or broadcasts.
- You want zero dependencies on the Keebai backend (offline development, air-gapped envs).

You lose:

- **Webhooks normalization** — you handle Meta's raw envelope yourself.
- **`client.templates.list/create/update`** — Meta's Business Management API isn't exposed in this SDK; use `wa-cloud-api` or curl for that.
- **`client.messages.sendBulk` / `getBulkStatus`** — these are Keebai-specific orchestration.
- **Dashboard visibility** — messages don't show up anywhere.
- **Multi-tenant routing** — one client = one access token = one number/WABA.

What you keep:

- Every `client.messages.send*` method (text, image, video, audio, document, sticker, location, contacts, reaction, markRead, interactive *, template, raw).
- Every `client.media.*` method.
- Same error model.
- Same TypeScript surface.

## Setup

Get an access token from Meta:

1. [developers.facebook.com](https://developers.facebook.com) → My Apps → your app.
2. WhatsApp → Getting started → temporary access token (24h dev) **OR** System Users → permanent token.
3. Note your `phone_number_id` from the same screen.

```ts
import { WhatsAppClient } from "@keebai/sdk";

const wa = new WhatsAppClient({
  accessToken: process.env.META_ACCESS_TOKEN!,
  phoneNumberId: process.env.META_PHONE_NUMBER_ID!,
});

await wa.messages.sendText({
  to: "+5491155555555",
  body: "Hola desde Meta directo",
});
```

The mode is inferred from `accessToken` (vs `apiKey`). You can force it: `mode: "meta"`.

## Options specific to Meta mode

```ts
new WhatsAppClient({
  mode: "meta",                                    // optional
  accessToken: "EAA...",
  phoneNumberId: "100000000000001",                // default for all calls
  baseUrl: "https://graph.facebook.com",           // default
  apiVersion: "v21.0",                              // default
  timeoutMs: 30_000,
  retries: 2,
});
```

## Trade-off table

| Concern | Keebai mode | Meta mode |
|---|---|---|
| Auth | PAT (`pat_...`) — created in Keebai dashboard | Meta access token (`EAA...`) — from developers.facebook.com |
| Identifier | `phone_number_id` (Meta numeric id) | `phone_number_id` (same numeric id) |
| Persistence | Yes — conversations stored in Keebai | No — Meta keeps no historical store of your sends |
| Webhooks | Normalized `{ event, data, timestamp }` envelope, HMAC-signed | Raw Meta envelope, you decode |
| Broadcasts (`sendBulk`) | Yes | Not available — build your own queue |
| Templates CRUD | Yes (`client.templates.*`) | Not in this SDK — call Meta BM API directly |
| Dashboard | Yes | No |
| Multi-tenant | Single PAT, many `phone_number_id` values | One access token per WABA |
| Rate limits | Keebai layer + Meta layer | Meta only |
| Send messages | Full surface | Full surface |
| Send media | Full surface | Full surface |

## When to switch from Meta to Keebai mode

If your project starts needing any of:

- A queryable history of sent/received messages.
- Webhook delivery with retries and audit log.
- Marketing broadcasts to thousands of recipients.
- Multi-tenant operation (agencies, white-label).
- Template approval automation.
- Customer support handoff (assigning conversations to agents).

…switch to Keebai mode. The only code change is `accessToken: "EAA..."` → `apiKey: "pat_..."`. Method signatures stay identical for the shared subset.
