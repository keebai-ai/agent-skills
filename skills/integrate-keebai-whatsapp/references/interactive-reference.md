# Interactive Messages Reference

Interactive messages let the user tap buttons or pick from a list instead of typing back. Replies arrive via webhook with the button `id` or list row `id` as the message body.

## Buttons (`sendInteractiveButtons`)

Up to 3 reply buttons. Best for yes/no/maybe flows or short fixed choices.

```ts
await wa.messages.sendInteractiveButtons({
  to: "+5491155555555",
  bodyText: "¿Confirmás tu pedido?",
  buttons: [
    { id: "confirm",  title: "Confirmar" },
    { id: "modify",   title: "Modificar" },
    { id: "cancel",   title: "Cancelar" },
  ],
  header: { type: "text", text: "Pedido #1234" },  // optional
  footerText: "Powered by Keebai",                  // optional, max 60 chars
});
```

### Limits

| Field | Max |
|---|---|
| `buttons[]` | 3 |
| `button.title` | 20 chars |
| `button.id` | 256 chars (your internal identifier) |
| `bodyText` | 1024 chars |
| `header.text` | 60 chars |
| `footerText` | 60 chars |

### Reply

On tap, your webhook receives `whatsapp.message.received` with:

```json
{
  "type": "interactive",
  "interactive": {
    "type": "button_reply",
    "button_reply": { "id": "confirm", "title": "Confirmar" }
  }
}
```

## List (`sendInteractiveList`)

A tappable button reveals a scrollable list with sections. Best for menus with 4+ options or grouped choices.

```ts
await wa.messages.sendInteractiveList({
  to: "+5491155555555",
  bodyText: "¿En qué te ayudo?",
  buttonText: "Ver opciones",
  sections: [
    {
      title: "Soporte",
      rows: [
        { id: "billing",  title: "Facturación", description: "Pagos, facturas, créditos" },
        { id: "tech",     title: "Técnico",     description: "Bugs e integraciones" },
      ],
    },
    {
      title: "Comercial",
      rows: [
        { id: "demo",     title: "Pedir demo" },
        { id: "pricing",  title: "Planes" },
      ],
    },
  ],
});
```

### Limits

| Field | Max |
|---|---|
| `sections[]` | 10 |
| `rows[]` per section | 10 |
| `row.title` | 24 chars |
| `row.description` | 72 chars |
| `row.id` | 200 chars |
| `buttonText` | 20 chars |
| `section.title` | 24 chars |
| `bodyText` | 1024 chars |

### Reply

```json
{
  "type": "interactive",
  "interactive": {
    "type": "list_reply",
    "list_reply": { "id": "billing", "title": "Facturación", "description": "Pagos…" }
  }
}
```

## CTA URL (`sendInteractiveCtaUrl`)

A single tappable URL button. Best when you want to drive users to an external page (changelog, docs, payment link) without sending a raw URL that may not render as a button.

```ts
await wa.messages.sendInteractiveCtaUrl({
  to: "+5491155555555",
  bodyText: "Tu factura está lista para descargar",
  parameters: {
    displayText: "Ver factura",
    url: "https://app.example.com/invoices/abc",
  },
  footerText: "Vence en 7 días",
});
```

### Limits

| Field | Max |
|---|---|
| `bodyText` | 1024 chars |
| `parameters.displayText` | 20 chars |
| `parameters.url` | https URL (must be public; no auth) |

## Catalog (`sendInteractiveCatalogMessage`)

Opens the merchant's connected Commerce catalog at a specific product (optional thumbnail).

```ts
await wa.messages.sendInteractiveCatalogMessage({
  to: "+5491155555555",
  bodyText: "Mirá nuestros productos destacados",
  parameters: {
    thumbnailProductRetailerId: "sku-premium-001",   // optional
  },
  footerText: "Envío gratis sobre $20.000",
});
```

Requires the WABA to have an attached Commerce catalog. Configure it in Meta Commerce Manager before sending.

## Picking the right type

- **2-3 quick replies** → `sendInteractiveButtons`.
- **4-100 grouped options** → `sendInteractiveList`.
- **External link with explicit CTA** → `sendInteractiveCtaUrl`.
- **Browse products** → `sendInteractiveCatalogMessage`.

If you need richer flows (multi-step forms, validation, business logic) use **WhatsApp Flows** — schedule via templates with `subType: "flow"` buttons. Flows are not in this skill's scope yet.

## Handling replies

All interactive replies come in as `whatsapp.message.received` events with `type: "interactive"`. Branch on `interactive.type` (`button_reply` | `list_reply`) and switch on the `id`. See [`webhooks-reference.md`](webhooks-reference.md) for the full payload shape and handler example.
