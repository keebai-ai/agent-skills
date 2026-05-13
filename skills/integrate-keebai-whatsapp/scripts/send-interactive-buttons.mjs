#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs, parseJsonFlag } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage:
    "send-interactive-buttons.mjs --to <e164> --body <text> --buttons '<json-array>' [--header-text <text>] [--footer-text <text>] [--phone-number-id <id>]",
  required: ["to", "body", "buttons"],
});

const buttons = parseJsonFlag(args.buttons, "buttons");
if (!Array.isArray(buttons) || buttons.length === 0 || buttons.length > 3) {
  process.stderr.write('error: --buttons must be a JSON array of 1..3 items like [{"id":"yes","title":"Yes"}]\n');
  process.exit(2);
}

const client = loadClient();
const res = await client.messages.sendInteractiveButtons({
  to: args.to,
  bodyText: args.body,
  buttons,
  ...(args.headerText ? { header: { type: "text", text: args.headerText } } : {}),
  ...(args.footerText ? { footerText: args.footerText } : {}),
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
