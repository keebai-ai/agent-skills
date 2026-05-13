#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "send-document.mjs --to <e164> (--link <url> | --media-id <id>) [--filename <name>] [--caption <text>] [--phone-number-id <id>]",
  required: ["to"],
});

if (!args.link && !args.mediaId) {
  process.stderr.write("error: pass either --link <url> or --media-id <id>\n");
  process.exit(2);
}

const client = loadClient();
const res = await client.messages.sendDocument({
  to: args.to,
  document: {
    ...(args.link ? { link: args.link } : {}),
    ...(args.mediaId ? { id: args.mediaId } : {}),
    ...(args.filename ? { filename: args.filename } : {}),
    ...(args.caption ? { caption: args.caption } : {}),
  },
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
