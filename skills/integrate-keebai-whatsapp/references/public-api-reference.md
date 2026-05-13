# Public API Reference

For callers who don't want the TypeScript SDK (Go, Python, PHP, raw `curl`), here is the direct HTTP surface of `api.keebai.com/v1` exposed for WhatsApp messaging and media.

Auth on every endpoint:

```
Authorization: Bearer pat_<hex64>
```

Errors follow the envelope:

```json
{ "error": { "code": "invalid_phone", "message": "...", "details": { /* optional */ } } }
```

## Messages — single sends (no broadcast record)

All single-send endpoints return `HTTP 202 Accepted` with:

```json
{ "message_id": "wamid.HBgL...", "status": "sent", "sent_at": "2026-05-13T00:00:00Z" }
```

| Method | Path | Body |
|---|---|---|
| `POST` | `/v1/messages/text` | `{ to, phone_number_id, text, preview_url?, meta_data? }` |
| `POST` | `/v1/messages/image` | `{ to, phone_number_id, link?\|media_id?, caption?, meta_data? }` |
| `POST` | `/v1/messages/video` | `{ to, phone_number_id, link?\|media_id?, caption?, meta_data? }` |
| `POST` | `/v1/messages/audio` | `{ to, phone_number_id, link?\|media_id?, voice?, meta_data? }` |
| `POST` | `/v1/messages/document` | `{ to, phone_number_id, link?\|media_id?, filename?, caption?, meta_data? }` |
| `POST` | `/v1/messages/sticker` | `{ to, phone_number_id, link?\|media_id?, meta_data? }` |
| `POST` | `/v1/messages/location` | `{ to, phone_number_id, latitude, longitude, name?, address?, meta_data? }` |
| `POST` | `/v1/messages/contacts` | `{ to, phone_number_id, contacts: [...], meta_data? }` |
| `POST` | `/v1/messages/reaction` | `{ to, phone_number_id, message_id, emoji, meta_data? }` |
| `POST` | `/v1/messages/mark-read` | `{ phone_number_id, message_id, typing_indicator? }` → `{ success: true }` (HTTP 200) |
| `POST` | `/v1/messages/template` | `{ to, phone_number_id, template_name, language, variables?, meta_data? }` |
| `POST` | `/v1/messages/interactive/buttons` | `{ to, phone_number_id, body_text, buttons: [{id,title}], header?, footer_text?, meta_data? }` |
| `POST` | `/v1/messages/interactive/list` | `{ to, phone_number_id, body_text, button_text, sections: [...], header?, footer_text?, meta_data? }` |
| `POST` | `/v1/messages/interactive/cta-url` | `{ to, phone_number_id, body_text, display_text, url, header?, footer_text?, meta_data? }` |
| `POST` | `/v1/messages/interactive/catalog` | `{ to, phone_number_id, body_text, thumbnail_product_retailer_id?, footer_text?, meta_data? }` |
| `POST` | `/v1/messages/raw` | `{ phone_number_id, body: <raw Meta body>, meta_data? }` |

## Messages — bulk (broadcast record)

```
POST /v1/messages/bulk
{ phone_number_id, template_name, language, recipients: [{to, variables?, meta_data?}], campaign_name? }
→ HTTP 202
{ "broadcast_id": "...", "status": "scheduled", "total_recipients": 2, "scheduled_at": null }
```

```
GET /v1/messages/bulk/:broadcastId
→ HTTP 200
{ "broadcast_id": "...", "status": "running", "total_recipients": 2, "sent": 1, "failed": 0, "pending": 1, "started_at": "...", "completed_at": null }
```

## Media

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/media/upload` | `multipart/form-data` with fields `file`, `phone_number_id`, `type`, `filename?`. Returns `{ media_id, mime_type, size }`. |
| `GET` | `/v1/media/:mediaId?phone_number_id=...` | Returns `{ id, url, mime_type, file_size, sha256?, messaging_product? }`. |
| `DELETE` | `/v1/media/:mediaId?phone_number_id=...` | HTTP 204 on success. |
| `GET` | `/v1/media/:mediaId/download?phone_number_id=...` | Streams the binary; sets `Content-Type` to the media's MIME. |

## Templates

| Method | Path | Body |
|---|---|---|
| `GET` | `/v1/templates?limit=&cursor=` | `{ data: [Template], next_cursor? }` |
| `POST` | `/v1/templates` | `{ name, language, category, components }` |
| `PATCH` | `/v1/templates/:id` | `{ components?, category? }` |

## Webhooks

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/webhooks` | Subscribe. Body: `{ url, events, description? }`. Returns `{ id, url, events, secret, … }` (secret shown only here). |
| `GET` | `/v1/webhooks` | List. |
| `GET` | `/v1/webhooks/:id` | Get one. |
| `PATCH` | `/v1/webhooks/:id` | Update url/events/active. |
| `DELETE` | `/v1/webhooks/:id` | Remove. |
| `POST` | `/v1/webhooks/:id/test` | Trigger a synthetic delivery. |
| `GET` | `/v1/webhooks/:id/deliveries?limit=&cursor=` | List delivery attempts. |

## Scopes

A PAT must carry the right scopes:

| Scope | Endpoints |
|---|---|
| `messages:send` | All `/v1/messages/*` single sends + `/v1/media/*` + template send |
| `messages:bulk` | `/v1/messages/bulk` + `/v1/messages/bulk/:id` |
| `templates:read` | `GET /v1/templates`, `GET /v1/templates/:id` |
| `templates:write` | `POST/PATCH /v1/templates` |
| `webhooks:read` | `GET /v1/webhooks*` |
| `webhooks:write` | `POST/PATCH/DELETE /v1/webhooks*` |

Create tokens with the minimum scope set required.

## Quick `curl` examples

```bash
# sendText
curl -X POST https://api.keebai.com/v1/messages/text \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -d '{"to":"+5491155555555","phone_number_id":"100000000000001","text":"Hola"}'

# upload media
curl -X POST https://api.keebai.com/v1/media/upload \
  -H "Authorization: Bearer $PAT" \
  -F file=@logo.png \
  -F phone_number_id=100000000000001 \
  -F type=image/png \
  -F filename=logo.png

# sendTemplate
curl -X POST https://api.keebai.com/v1/messages/template \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -d '{
    "to":"+5491155555555",
    "phone_number_id":"100000000000001",
    "template_name":"welcome_v2",
    "language":"es",
    "variables":{"nombre":"Lucio"}
  }'

# subscribe webhook
curl -X POST https://api.keebai.com/v1/webhooks \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your.app/keebai","events":["whatsapp.message.received"]}'
```
