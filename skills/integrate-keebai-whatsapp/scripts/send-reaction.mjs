#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "send-reaction.mjs --to <e164> --message-id <wamid> --emoji <emoji> [--phone-number-id <id>]",
  required: ["to", "message-id", "emoji"],
});

const client = loadClient();
const res = await client.messages.sendReaction({
  to: args.to,
  reaction: { messageId: args.messageId, emoji: args.emoji },
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
