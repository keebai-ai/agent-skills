# Getting Started

Five-minute walkthrough from zero to your first WhatsApp message via Keebai.

## Prerequisites

1. A Keebai account at [app.keebai.com](https://app.keebai.com).
2. A WhatsApp Business number connected to that account. If you don't have one, go to **Channels → Add channel → WhatsApp** in the dashboard and complete the Meta embedded signup flow.

## 1. Get a Personal Access Token (PAT)

In the Keebai dashboard go to **Settings → API tokens → Create token**, give it a name and the `messages:send` (plus `messages:bulk` if you plan to use broadcasts) scope. Copy the `pat_<hex64>` value — it is shown only once.

CLI alternative (if you have `@keebai/cli`):

```bash
keebai auth
keebai tokens create --name "my-app" --scopes messages:send
```

## 2. Find your `phone_number_id`

Each connected WhatsApp Business number has a Meta-issued numeric identifier. List your connected numbers:

```bash
curl -H "Authorization: Bearer $KEEBAI_API_KEY" https://api.keebai.com/v1/whatsapp/numbers
```

Or open **Channels → WhatsApp** in the dashboard; the `phone_number_id` is shown under each number.

## 3. Install the SDK

```bash
npm i @keebai/sdk
```

## 4. Send your first message

```ts
// hello-keebai.ts
import { WhatsAppClient } from "@keebai/sdk";

const wa = new WhatsAppClient({
  apiKey: process.env.KEEBAI_API_KEY!,
  phoneNumberId: process.env.KEEBAI_PHONE_NUMBER_ID!,
});

const res = await wa.messages.sendText({
  to: "+5491155555555",
  body: "Hola desde Keebai 👋",
});

console.log(res.messages?.[0]?.id);
```

Run it:

```bash
export KEEBAI_API_KEY=pat_...
export KEEBAI_PHONE_NUMBER_ID=...
npx tsx hello-keebai.ts
```

Expected output: a Meta message id like `wamid.HBgL...`.

## 5. Confirm in the dashboard

Open **Conversations** in the Keebai dashboard. The outbound message should appear in the conversation with the destination number, with a delivery status that progresses from `sent` → `delivered` → `read`.

## Where to go next

- Send media (image, video, document, audio): [`media-reference.md`](media-reference.md).
- Send interactive buttons/lists: [`interactive-reference.md`](interactive-reference.md).
- Send approved templates: [`templates-reference.md`](templates-reference.md).
- Receive webhook events: [`webhooks-reference.md`](webhooks-reference.md).
- Handle errors and retries: [`errors-reference.md`](errors-reference.md).
