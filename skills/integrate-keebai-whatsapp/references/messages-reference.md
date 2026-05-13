# Messages Reference

Every method on `client.messages.*`, with TypeScript signatures, response shape and runnable examples. All methods work in both `keebai` and `meta` modes unless flagged otherwise.

## Common shapes

```ts
interface SendMessageResponse {
  messagingProduct: string;            // "whatsapp"
  messages?: { id: string }[];         // [{ id: "wamid.HBgL..." }]
  contacts?: { input: string; waId: string }[];
  raw: unknown;                        // original backend payload
}
```

The `phoneNumberId` field on every input is optional if you set a default in `WhatsAppClient({ phoneNumberId })`. Pass it per-call to operate multiple numbers from one client.

---

## `sendText`

```ts
sendText(input: {
  to: string;              // E.164, e.g. "+5491155555555"
  body: string;            // up to 4096 chars
  previewUrl?: boolean;    // render link previews
  phoneNumberId?: string;
  metaData?: Record<string, unknown>;
}): Promise<SendMessageResponse>
```

```ts
await wa.messages.sendText({
  to: "+5491155555555",
  body: "Hola, ¿cómo estás?",
  previewUrl: true,
});
```

---

## `sendImage`

```ts
sendImage(input: {
  to: string;
  image: { link?: string; id?: string; caption?: string };  // exactly one of link/id
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

```ts
// By public URL
await wa.messages.sendImage({
  to: "+5491155555555",
  image: { link: "https://cdn.example.com/banner.png", caption: "Launch" },
});

// By previously-uploaded media_id
await wa.messages.sendImage({
  to: "+5491155555555",
  image: { id: "media_abc123", caption: "Logo" },
});
```

---

## `sendVideo`

```ts
sendVideo(input: {
  to: string;
  video: { link?: string; id?: string; caption?: string };
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

```ts
await wa.messages.sendVideo({
  to: "+5491155555555",
  video: { link: "https://cdn.example.com/demo.mp4", caption: "Demo" },
});
```

---

## `sendAudio`

```ts
sendAudio(input: {
  to: string;
  audio: { link?: string; id?: string; voice?: boolean };
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

`voice: true` sends as PTT (push-to-talk). Format: OGG with Opus codec for PTT.

```ts
await wa.messages.sendAudio({
  to: "+5491155555555",
  audio: { link: "https://cdn.example.com/note.ogg", voice: true },
});
```

---

## `sendDocument`

```ts
sendDocument(input: {
  to: string;
  document: {
    link?: string;
    id?: string;
    filename?: string;
    caption?: string;
  };
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

```ts
await wa.messages.sendDocument({
  to: "+5491155555555",
  document: {
    link: "https://cdn.example.com/invoice.pdf",
    filename: "invoice-march.pdf",
    caption: "Your March invoice",
  },
});
```

---

## `sendSticker`

```ts
sendSticker(input: {
  to: string;
  sticker: { link?: string; id?: string };  // WebP only
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

---

## `sendLocation`

```ts
sendLocation(input: {
  to: string;
  location: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

```ts
await wa.messages.sendLocation({
  to: "+5491155555555",
  location: {
    latitude: -33.4489,
    longitude: -70.6693,
    name: "Plaza de Armas",
    address: "Santiago, Chile",
  },
});
```

---

## `sendContacts`

```ts
sendContacts(input: {
  to: string;
  contacts: ContactObject[];
  phoneNumberId?: string;
}): Promise<SendMessageResponse>

interface ContactObject {
  name: { formatted_name: string; first_name?: string; last_name?: string };
  phones?: { phone: string; type?: string; wa_id?: string }[];
  emails?: { email: string; type?: string }[];
  org?: { company?: string; department?: string; title?: string };
  addresses?: Record<string, unknown>[];
  urls?: { url: string; type?: string }[];
  birthday?: string;
}
```

```ts
await wa.messages.sendContacts({
  to: "+5491155555555",
  contacts: [
    {
      name: { formatted_name: "Soporte Keebai", first_name: "Soporte" },
      phones: [{ phone: "+56912345678", type: "WORK" }],
      org: { company: "Keebai" },
    },
  ],
});
```

---

## `sendReaction`

```ts
sendReaction(input: {
  to: string;
  reaction: { messageId: string; emoji: string };  // emoji "" clears reaction
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

```ts
await wa.messages.sendReaction({
  to: "+5491155555555",
  reaction: { messageId: "wamid.HBgL...", emoji: "👍" },
});
```

---

## `markRead`

```ts
markRead(input: {
  messageId: string;
  typingIndicator?: "text" | "off";
  phoneNumberId?: string;
}): Promise<{ success: boolean }>
```

```ts
await wa.messages.markRead({
  messageId: "wamid.HBgL...",
  typingIndicator: "text",   // show "typing..." after marking read
});
```

---

## `sendInteractiveButtons`

```ts
sendInteractiveButtons(input: {
  to: string;
  bodyText: string;                       // max 1024
  buttons: { id: string; title: string }[];  // 1..3 items, title max 20 chars
  header?: { type: "text"; text: string };
  footerText?: string;                    // max 60
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

```ts
await wa.messages.sendInteractiveButtons({
  to: "+5491155555555",
  bodyText: "Confirm your order?",
  buttons: [
    { id: "confirm", title: "Confirm" },
    { id: "cancel", title: "Cancel" },
  ],
  footerText: "Powered by Keebai",
});
```

---

## `sendInteractiveList`

```ts
sendInteractiveList(input: {
  to: string;
  bodyText: string;
  buttonText: string;       // max 20
  sections: {
    title?: string;
    rows: { id: string; title: string; description?: string }[];
  }[];                       // 1..10 sections, each with 1..10 rows
  header?: { type: "text"; text: string };
  footerText?: string;
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

```ts
await wa.messages.sendInteractiveList({
  to: "+5491155555555",
  bodyText: "Pick a category",
  buttonText: "Options",
  sections: [
    {
      title: "Support",
      rows: [
        { id: "billing", title: "Billing", description: "Invoices, payments" },
        { id: "tech", title: "Tech", description: "Bugs, integrations" },
      ],
    },
  ],
});
```

---

## `sendInteractiveCtaUrl`

```ts
sendInteractiveCtaUrl(input: {
  to: string;
  bodyText: string;
  parameters: { displayText: string; url: string };
  header?: { type: "text"; text: string };
  footerText?: string;
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

```ts
await wa.messages.sendInteractiveCtaUrl({
  to: "+5491155555555",
  bodyText: "Read our latest changelog",
  parameters: { displayText: "Read more", url: "https://keebai.com/changelog" },
});
```

---

## `sendInteractiveCatalogMessage`

```ts
sendInteractiveCatalogMessage(input: {
  to: string;
  bodyText: string;
  parameters: { thumbnailProductRetailerId?: string };
  footerText?: string;
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

Requires the WABA to have a connected Commerce catalog. See [Meta docs](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/sell-products-and-services).

---

## `sendTemplate`

```ts
sendTemplate(input: {
  to: string;
  templateName: string;
  language: string;                                       // e.g. "es", "en_US"
  variables?: Record<string, string> | string[];          // named (Keebai) or positional (Meta)
  components?: unknown[];                                 // advanced: pre-built Meta components
  phoneNumberId?: string;
  metaData?: Record<string, unknown>;
}): Promise<SendMessageResponse>
```

Named variables (recommended; maps to Meta `parameter_name`):

```ts
await wa.messages.sendTemplate({
  to: "+5491155555555",
  templateName: "order_confirmation",
  language: "es",
  variables: { nombre: "Lucio", monto: "1500" },
});
```

Positional variables (legacy templates):

```ts
await wa.messages.sendTemplate({
  to: "+5491155555555",
  templateName: "order_confirmation",
  language: "es",
  variables: ["Lucio", "1500"],
});
```

For headers + buttons + flows, use `buildTemplateSendPayload` and pass `components` directly. See `templates-reference.md`.

---

## `sendBulk` (Keebai mode only)

Schedules a template broadcast to many recipients. This is the **only** method that creates a `broadcasts` record on Keebai. Returns a `broadcastId` you can poll with `getBulkStatus`.

```ts
sendBulk(input: {
  templateName: string;
  language: string;
  recipients: {
    to: string;
    variables?: Record<string, string>;
    metaData?: Record<string, unknown>;
  }[];                                              // 1..5000
  campaignName?: string;
  phoneNumberId?: string;
}): Promise<{ broadcastId: string; accepted: number }>
```

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
```

---

## `getBulkStatus` (Keebai mode only)

```ts
getBulkStatus(broadcastId: string): Promise<{
  broadcastId: string;
  status: string;       // "scheduled" | "running" | "completed" | "failed"
  total: number;
  sent: number;
  failed: number;
  pending: number;
  [key: string]: unknown;
}>
```

```ts
const status = await wa.messages.getBulkStatus(broadcastId);
console.log(`${status.sent}/${status.total} sent`);
```

---

## `sendRaw` — escape hatch

Forward a raw Meta Graph API body. Use when no high-level method fits (advanced template components, beta Meta features, etc.).

```ts
sendRaw(input: {
  body: Record<string, unknown>;   // sent as-is to /{phoneNumberId}/messages
  phoneNumberId?: string;
}): Promise<SendMessageResponse>
```

```ts
await wa.messages.sendRaw({
  body: {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "+5491155555555",
    type: "text",
    text: { body: "raw mode", preview_url: false },
  },
});
```
