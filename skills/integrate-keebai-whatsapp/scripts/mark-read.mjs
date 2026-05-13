#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "mark-read.mjs --message-id <wamid> [--typing text|off] [--phone-number-id <id>]",
  required: ["message-id"],
});

const client = loadClient();
const res = await client.messages.markRead({
  messageId: args.messageId,
  ...(args.typing ? { typingIndicator: args.typing } : {}),
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
