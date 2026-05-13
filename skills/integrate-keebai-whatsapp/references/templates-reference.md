# Templates Reference

WhatsApp templates are pre-approved message bodies (by Meta) used for outbound messages outside an open 24-hour conversation window. Required for marketing, transactional notifications, OTPs, etc.

## Anatomy of a template

A template has:

- A `name` (lowercase + underscores).
- A `language` code (`es`, `en_US`, `pt_BR`, etc.).
- A `category` (`MARKETING`, `UTILITY`, `AUTHENTICATION`).
- A list of `components`: header, body, footer, buttons.

Each component can have parameters (named or positional) filled in at send time.

## Sending an approved template

### Named variables (recommended)

Keebai expects variables as `Record<string, string>` and translates to Meta's `parameter_name` format internally:

```ts
await wa.messages.sendTemplate({
  to: "+5491155555555",
  templateName: "order_confirmation",
  language: "es",
  variables: {
    nombre: "Lucio",
    pedido: "ORD-1234",
    monto: "$15.000",
  },
});
```

This works only if the template was created with named placeholders (`{{nombre}}`, `{{pedido}}`, `{{monto}}`).

### Positional variables (legacy templates)

```ts
await wa.messages.sendTemplate({
  to: "+5491155555555",
  templateName: "order_legacy",
  language: "es",
  variables: ["Lucio", "ORD-1234", "$15.000"],
});
```

The SDK builds the Meta body component with `parameters[]` in order.

### Custom components (headers, buttons, flows)

When the template has a media header or buttons (URL/quick_reply/flow), build the components explicitly:

```ts
import { buildTemplateSendPayload } from "@keebai/sdk";

const template = buildTemplateSendPayload({
  name: "promo_with_image",
  language: "es",
  header: { type: "image", image: { link: "https://cdn.example.com/banner.png" } },
  body: [
    { type: "text", text: "Lucio", parameterName: "nombre" },
    { type: "text", text: "20%", parameterName: "descuento" },
  ],
  buttons: [
    { subType: "url", index: 0, text: "spring" },             // appended to URL template
    { subType: "quick_reply", index: 1, payload: "OPT_OUT" }, // sent in webhook on tap
  ],
});

await wa.messages.sendTemplate({
  to: "+5491155555555",
  templateName: "promo_with_image",
  language: "es",
  components: template.components,
});
```

## Header types

```ts
type TemplateHeaderInput =
  | { type: "text"; text: string }
  | { type: "image"; image: { link?: string; id?: string } }
  | { type: "video"; video: { link?: string; id?: string } }
  | { type: "document"; document: { link?: string; id?: string; filename?: string } };
```

## Button types

```ts
type TemplateButtonInput =
  | { subType: "quick_reply"; index: number; payload: string }
  | { subType: "url"; index: number; text: string }
  | {
      subType: "flow";
      index: number;
      flowToken: string;
      flowActionData?: Record<string, unknown>;
    };
```

- `quick_reply` — appears as a tappable button; on tap, your webhook receives a `whatsapp.message.received` event with the `payload` as the body.
- `url` — appends the `text` parameter to the URL placeholder defined in the template.
- `flow` — opens a WhatsApp Flow (form). `flowToken` is your session identifier; `flowActionData` pre-fills the first screen.

## Templates CRUD (Keebai mode only)

Meta exposes template CRUD only through the Business Management API (separate from Cloud API). Keebai wraps that in `client.templates.*`:

```ts
// List approved templates
const { data, nextCursor } = await wa.templates.list({ limit: 20 });

// Create a template (submits to Meta for approval)
const tpl = await wa.templates.create({
  name: "order_confirmation",
  language: "es",
  category: "UTILITY",
  components: [
    { type: "BODY", text: "Hola {{nombre}}, tu pedido {{pedido}} fue confirmado." },
  ],
});
console.log(tpl.id, tpl.status);  // status is "PENDING" until Meta approves

// Update a template (only allowed when status is PENDING or APPROVED depending on the field)
await wa.templates.update(tpl.id, {
  components: [
    { type: "BODY", text: "Hola {{nombre}}, tu pedido {{pedido}} está listo." },
  ],
});
```

In `meta` mode these methods throw `MetaModeUnsupportedError` because raw Cloud API does not expose CRUD on the same endpoint set.

## Status lifecycle

Templates submitted via `templates.create` go through Meta's review:

- `PENDING` — under review (usually <24h, can take up to 48h)
- `APPROVED` — usable in `sendTemplate`
- `REJECTED` — review failed; check the dashboard for the reason

You can listen for `whatsapp.template.status_update` webhook events to react to approval state changes. See [`webhooks-reference.md`](webhooks-reference.md).

## Tips

- **Naming**: lowercase + underscores. Be descriptive (`order_confirmation_v2`, not `tpl1`).
- **Categories**: `UTILITY` is fastest to approve, `MARKETING` is strictest, `AUTHENTICATION` is for OTPs only.
- **Variables**: name them clearly. `{{nombre}}` is better than `{{1}}` because it survives renames and is human-readable at the call site.
- **Buttons in templates**: limit per Meta is 10 total buttons; quick_reply + url + flow can mix.
- **Test before send**: use the Meta Business Manager preview to confirm rendering before sending real templates.
