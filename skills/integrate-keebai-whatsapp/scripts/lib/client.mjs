import { WhatsAppClient } from "@keebai/sdk";

export function loadClient() {
  const apiKey = process.env.KEEBAI_API_KEY;
  const phoneNumberId = process.env.KEEBAI_PHONE_NUMBER_ID;
  const baseUrl = process.env.KEEBAI_BASE_URL;

  if (!apiKey) {
    fail("Missing KEEBAI_API_KEY env var (expected `pat_<hex64>`).");
  }
  if (!phoneNumberId) {
    fail("Missing KEEBAI_PHONE_NUMBER_ID env var (numeric Meta identifier).");
  }

  return new WhatsAppClient({
    apiKey,
    phoneNumberId,
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export function printJson(value) {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

function fail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(2);
}
