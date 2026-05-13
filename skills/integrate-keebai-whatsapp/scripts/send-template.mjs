#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs, parseJsonFlag } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage:
    "send-template.mjs --to <e164> --name <template-name> --language <code> [--variables '<json>'] [--phone-number-id <id>]",
  required: ["to", "name", "language"],
});

const variables = parseJsonFlag(args.variables, "variables");

const client = loadClient();
const res = await client.messages.sendTemplate({
  to: args.to,
  templateName: args.name,
  language: args.language,
  ...(variables !== undefined ? { variables } : {}),
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
