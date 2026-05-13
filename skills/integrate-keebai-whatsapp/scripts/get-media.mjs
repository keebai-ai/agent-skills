#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "get-media.mjs --media-id <id> [--phone-number-id <id>]",
  required: ["media-id"],
});

const client = loadClient();
const res = await client.media.get({
  mediaId: args.mediaId,
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
