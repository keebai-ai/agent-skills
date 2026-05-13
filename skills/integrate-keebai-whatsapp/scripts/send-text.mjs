#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "send-text.mjs --to <e164> --text <body> [--preview-url] [--phone-number-id <id>]",
  required: ["to", "text"],
  booleans: ["preview-url"],
});

const client = loadClient();
const res = await client.messages.sendText({
  to: args.to,
  body: args.text,
  ...(args.previewUrl ? { previewUrl: true } : {}),
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
