# Webhooks Reference

Keebai delivers WhatsApp events to your HTTPS endpoint as JSON POST requests. Subscribe via the public-api with a PAT.

## Subscribe a webhook

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
    ],
    "description": "Production listener"
  }'
```

Returns:

```json
{
  "id": "wh_abc123",
  "url": "https://your.app/keebai-webhook",
  "events": ["whatsapp.message.received", "..."],
  "secret": "whsec_<hex64>",
  "active": true,
  "created_at": "2026-05-13T00:00:00Z"
}
```

**Save the `secret`** — you'll use it to verify incoming requests. It is shown only on creation.

### Manage webhooks

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/webhooks` | List your subscriptions |
| `GET` | `/v1/webhooks/:id` | Get one subscription |
| `PATCH` | `/v1/webhooks/:id` | Update `url`, `events`, `active` |
| `DELETE` | `/v1/webhooks/:id` | Remove subscription |
| `POST` | `/v1/webhooks/:id/test` | Trigger a synthetic delivery |
| `GET` | `/v1/webhooks/:id/deliveries` | Audit recent delivery attempts |

## Event catalog

| Event | When | Payload data |
|---|---|---|
| `whatsapp.message.received` | Customer sends a message to your number | message + sender contact (see `assets/webhook-message-received.example.json`) |
| `whatsapp.message.sent` | Your outbound message accepted by Meta | message_id + recipient |
| `whatsapp.message.delivered` | Recipient device received the message | message_id + timestamp |
| `whatsapp.message.read` | Recipient opened the message | message_id + timestamp |
| `whatsapp.message.failed` | Delivery failed | message_id + error code + reason |
| `whatsapp.template.status_update` | Template approval state changed | template id + name + status |
| `whatsapp.broadcast.completed` | A `sendBulk` campaign finished | broadcast_id + sent/failed counts |

> Some events are roadmap (`whatsapp.template.status_update`, `whatsapp.broadcast.completed`). Confirm availability in `app.keebai.com → Settings → Webhooks → Events` before relying on them.

## Payload shape (canonical)

All events share the envelope:

```json
{
  "event": "whatsapp.message.received",
  "timestamp": "2026-05-13T00:00:00.123Z",
  "data": { /* event-specific */ },
  "webhook_id": "wh_abc123"
}
```

See bundled examples:

- [`assets/webhook-message-received.example.json`](../assets/webhook-message-received.example.json) — inbound message (text, interactive button reply, list reply).
- [`assets/webhook-message-status.example.json`](../assets/webhook-message-status.example.json) — delivered/read/failed status.

## Signature verification

Each delivery includes an HMAC-SHA256 signature in the `X-Keebai-Signature` header:

```
X-Keebai-Signature: t=1715558400,v1=a7f3...
```

Verify it server-side before processing:

```ts
import crypto from "node:crypto";

function verifyKeebaiSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader) {
    return false;
  }
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => kv.split("=") as [string, string]),
  );
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}
```

Reject requests whose timestamp is more than 5 minutes old to prevent replay attacks.

## Handler example (Express)

```ts
import express from "express";
import { WhatsAppClient } from "@keebai/sdk";

const app = express();
const wa = new WhatsAppClient({
  apiKey: process.env.KEEBAI_API_KEY!,
  phoneNumberId: process.env.KEEBAI_PHONE_NUMBER_ID!,
});
const SECRET = process.env.KEEBAI_WEBHOOK_SECRET!;

// IMPORTANT: capture raw body for signature verification
app.post(
  "/keebai-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const raw = req.body.toString("utf8");
    if (!verifyKeebaiSignature(raw, req.header("X-Keebai-Signature"), SECRET)) {
      return res.status(401).end();
    }
    const payload = JSON.parse(raw);

    switch (payload.event) {
      case "whatsapp.message.received":
        await handleInbound(payload.data, wa);
        break;
      case "whatsapp.message.delivered":
      case "whatsapp.message.read":
      case "whatsapp.message.failed":
        await updateMessageStatus(payload.data);
        break;
    }

    res.status(200).end();
  },
);

async function handleInbound(data: any, wa: WhatsAppClient) {
  const from = data.from;
  const messageId = data.id;

  // 1. Mark as read + show typing
  await wa.messages.markRead({ messageId, typingIndicator: "text" });

  // 2. Branch on message type
  if (data.type === "text") {
    await wa.messages.sendText({ to: from, body: `Recibido: ${data.text.body}` });
  } else if (data.type === "interactive") {
    const id = data.interactive.button_reply?.id ?? data.interactive.list_reply?.id;
    await wa.messages.sendText({ to: from, body: `Elegiste: ${id}` });
  }
}
```

## Retries

Keebai retries failed deliveries (non-2xx response or timeout >30s) with exponential backoff for up to 24 hours. Inspect the delivery log in the dashboard or via `GET /v1/webhooks/:id/deliveries` to debug.

## Testing locally

Use `ngrok` or `cloudflared tunnel` to expose your local server, then point a dev webhook at the public URL. Trigger a synthetic delivery with `POST /v1/webhooks/:id/test`.

```bash
ngrok http 3000
# update webhook url to the ngrok https URL
curl -X POST https://api.keebai.com/v1/webhooks/wh_abc123/test \
  -H "Authorization: Bearer $KEEBAI_API_KEY"
```
