#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage:
    "send-interactive-cta-url.mjs --to <e164> --body <text> --display-text <text> --url <https-url> [--header-text <text>] [--footer-text <text>] [--phone-number-id <id>]",
  required: ["to", "body", "display-text", "url"],
});

const client = loadClient();
const res = await client.messages.sendInteractiveCtaUrl({
  to: args.to,
  bodyText: args.body,
  parameters: { displayText: args.displayText, url: args.url },
  ...(args.headerText ? { header: { type: "text", text: args.headerText } } : {}),
  ...(args.footerText ? { footerText: args.footerText } : {}),
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
