#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs, parseJsonFlag } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage:
    "send-bulk.mjs --name <template-name> --language <code> --recipients '<json-array>' [--campaign-name <text>] [--phone-number-id <id>]",
  required: ["name", "language", "recipients"],
});

const recipients = parseJsonFlag(args.recipients, "recipients");
if (!Array.isArray(recipients) || recipients.length === 0) {
  process.stderr.write(
    'error: --recipients must be a non-empty JSON array like [{"to":"+5491155555555","variables":{"nombre":"Lucio"}}]\n',
  );
  process.exit(2);
}

const client = loadClient();
const res = await client.messages.sendBulk({
  templateName: args.name,
  language: args.language,
  recipients,
  ...(args.campaignName ? { campaignName: args.campaignName } : {}),
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
