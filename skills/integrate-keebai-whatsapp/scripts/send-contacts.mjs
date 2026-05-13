#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs, parseJsonFlag } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: 'send-contacts.mjs --to <e164> --contacts \'<json-array>\' [--phone-number-id <id>]',
  required: ["to", "contacts"],
});

const contacts = parseJsonFlag(args.contacts, "contacts");
if (!Array.isArray(contacts) || contacts.length === 0) {
  process.stderr.write("error: --contacts must be a non-empty JSON array of contact cards\n");
  process.exit(2);
}

const client = loadClient();
const res = await client.messages.sendContacts({
  to: args.to,
  contacts,
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
