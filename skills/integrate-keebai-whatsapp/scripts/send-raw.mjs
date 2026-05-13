#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs, parseJsonFlag } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "send-raw.mjs --body '<json>' [--phone-number-id <id>]",
  required: ["body"],
});

const body = parseJsonFlag(args.body, "body");
if (typeof body !== "object" || body === null) {
  process.stderr.write("error: --body must be a JSON object (Meta messages body)\n");
  process.exit(2);
}

const client = loadClient();
const res = await client.messages.sendRaw({
  body,
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
