#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs, parseJsonFlag } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage:
    "send-interactive-list.mjs --to <e164> --body <text> --button-text <text> --sections '<json-array>' [--header-text <text>] [--footer-text <text>] [--phone-number-id <id>]",
  required: ["to", "body", "button-text", "sections"],
});

const sections = parseJsonFlag(args.sections, "sections");
if (!Array.isArray(sections) || sections.length === 0) {
  process.stderr.write(
    'error: --sections must be a non-empty JSON array like [{"title":"S1","rows":[{"id":"a","title":"A"}]}]\n',
  );
  process.exit(2);
}

const client = loadClient();
const res = await client.messages.sendInteractiveList({
  to: args.to,
  bodyText: args.body,
  buttonText: args.buttonText,
  sections,
  ...(args.headerText ? { header: { type: "text", text: args.headerText } } : {}),
  ...(args.footerText ? { footerText: args.footerText } : {}),
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
