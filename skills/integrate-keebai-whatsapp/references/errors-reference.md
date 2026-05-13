# Errors Reference

`@keebai/sdk` exposes a typed error hierarchy. Always catch by class, not by string matching.

## Hierarchy

```
WhatsAppError
├── WhatsAppApiError                    // 4xx/5xx from Keebai or Meta
├── WhatsAppValidationError              // bad input before the request
├── WhatsAppTimeoutError                 // request exceeded timeoutMs
├── KeebaiModeUnsupportedError           // method not available in keebai mode (legacy 0.1.x)
└── MetaModeUnsupportedError             // method not available in meta mode (sendBulk, templates CRUD)
```

In `@keebai/sdk@0.2.0+` Keebai mode supports the full message and media surface. `KeebaiModeUnsupportedError` should not fire in practice — if it does, file an issue.

## `WhatsAppApiError`

Thrown when the backend returns a non-2xx status that isn't retried (or that exhausted retries).

```ts
class WhatsAppApiError extends WhatsAppError {
  status: number;       // HTTP status: 400, 401, 403, 404, 422, 429, 500…
  code: string;         // stable error code: "invalid_phone", "UNAUTHORIZED", …
  message: string;      // human-readable
  raw: unknown;         // original response body
  fbtraceId?: string;   // Meta debugging id, only in meta mode
  details?: Record<string, unknown>;
}
```

Common codes:

| Code | Status | Meaning | What to do |
|---|---|---|---|
| `UNAUTHORIZED` | 401 | PAT is missing, invalid or revoked | Check the env var; rotate the token |
| `FORBIDDEN` | 403 | PAT lacks the required scope (`messages:send` / `messages:bulk`) | Create a new token with the right scopes |
| `CHANNEL_NOT_FOUND` | 404 | The `phone_number_id` doesn't belong to your company or is not connected | List your numbers; re-check the id |
| `CHANNEL_MISSING_ACCESS_TOKEN` | 400 | The channel is connected but the access token is invalid/expired | Reconnect WhatsApp in the dashboard |
| `invalid_phone` | 422 | The `to` field isn't a valid E.164 number | Normalize the phone (`normalizePhone(raw)`) before sending |
| `MEDIA_REFERENCE_REQUIRED` | 400 | A media send didn't include `link` or `media_id` | Pass exactly one |
| `MEDIA_REFERENCE_AMBIGUOUS` | 400 | A media send included both `link` and `media_id` | Pass only one |
| `THROTTLED` | 429 | Rate limit exceeded | The SDK retries automatically; if it surfaces, you exhausted retries — reduce send rate |
| `META_MISSING_MESSAGE_ID` | 400 | Meta accepted the call but didn't return a message id (rare) | Retry, or report to support |
| `SERVER_ERROR` | 5xx | Backend error | Auto-retried; if persists, status page |

## `WhatsAppValidationError`

Thrown by the SDK before issuing a request, when input is malformed:

- Missing `accessToken` AND `apiKey`.
- Both `accessToken` AND `apiKey` (ambiguous mode).
- Missing `phoneNumberId` in Keebai mode (no default and no per-call override).
- `normalizePhone()` called with non-E.164 input.

```ts
try {
  const wa = new WhatsAppClient({});  // no credentials
} catch (err) {
  if (err instanceof WhatsAppValidationError) {
    console.log(err.message);
    // "Client requires either 'accessToken' (Meta mode) or 'apiKey' (Keebai mode)."
  }
}
```

## `WhatsAppTimeoutError`

Thrown when a single HTTP attempt exceeds `timeoutMs` (default 30s):

```ts
const wa = new WhatsAppClient({
  apiKey: "pat_...",
  phoneNumberId: "...",
  timeoutMs: 5_000,
  retries: 0,
});

try {
  await wa.messages.sendText({ to: "+1...", body: "x" });
} catch (err) {
  if (err instanceof WhatsAppTimeoutError) {
    console.log(`Timed out after ${err.timeoutMs}ms`);
  }
}
```

## Retry policy

The SDK retries automatically when:

- HTTP 429 (rate limit).
- HTTP 5xx (server errors).
- Network errors (`ECONNRESET`, `ETIMEDOUT`, `EAI_AGAIN`, generic `TypeError` from fetch).
- `WhatsAppTimeoutError`.

Backoff: `250ms * 2^(attempt-1) + jitter`. Default `retries: 2` → up to 3 total attempts.

Disable retries for fail-fast:

```ts
const wa = new WhatsAppClient({ apiKey: "pat_...", phoneNumberId: "...", retries: 0 });
```

## Recommended handling pattern

```ts
import {
  WhatsAppApiError,
  WhatsAppValidationError,
  WhatsAppTimeoutError,
} from "@keebai/sdk";

async function sendSafe(wa: WhatsAppClient, to: string, body: string) {
  try {
    return await wa.messages.sendText({ to, body });
  } catch (err) {
    if (err instanceof WhatsAppValidationError) {
      // Caller bug — bad input. Don't retry. Log and rethrow.
      console.error("Bad input:", err.message);
      throw err;
    }
    if (err instanceof WhatsAppApiError) {
      if (err.status === 401 || err.status === 403) {
        // Credentials problem — alert ops, do not retry.
        await alertOps(`Auth failure: ${err.code}`);
        throw err;
      }
      if (err.status === 422 && err.code === "invalid_phone") {
        // Data quality — flag the contact, don't retry.
        await markContactInvalid(to);
        throw err;
      }
      // Generic API error — surface to caller.
      throw err;
    }
    if (err instanceof WhatsAppTimeoutError) {
      // Already retried by the SDK. Queue for later.
      await enqueueRetry({ to, body });
      throw err;
    }
    // Unknown — surface.
    throw err;
  }
}
```

## Debugging tips

- **`err.raw`** has the original backend response — pretty-print it for full context.
- **`err.fbtraceId`** (meta mode only) goes into Meta's support tickets.
- **`err.details`** carries validation errors per field on 422 from Keebai.
- Compare timestamps between SDK call and the dashboard's audit log (Keebai mode) to confirm the call reached the backend.
- For repeated `THROTTLED` errors, check the rate limit on your PAT (Settings → API tokens → Token detail).
