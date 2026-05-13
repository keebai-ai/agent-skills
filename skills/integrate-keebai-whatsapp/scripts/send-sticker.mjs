#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "send-sticker.mjs --to <e164> (--link <webp-url> | --media-id <id>) [--phone-number-id <id>]",
  required: ["to"],
});

if (!args.link && !args.mediaId) {
  process.stderr.write("error: pass either --link <url> or --media-id <id>\n");
  process.exit(2);
}

const client = loadClient();
const res = await client.messages.sendSticker({
  to: args.to,
  sticker: {
    ...(args.link ? { link: args.link } : {}),
    ...(args.mediaId ? { id: args.mediaId } : {}),
  },
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
