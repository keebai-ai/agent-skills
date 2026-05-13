#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "send-audio.mjs --to <e164> (--link <url> | --media-id <id>) [--voice] [--phone-number-id <id>]",
  required: ["to"],
  booleans: ["voice"],
});

if (!args.link && !args.mediaId) {
  process.stderr.write("error: pass either --link <url> or --media-id <id>\n");
  process.exit(2);
}

const client = loadClient();
const res = await client.messages.sendAudio({
  to: args.to,
  audio: {
    ...(args.link ? { link: args.link } : {}),
    ...(args.mediaId ? { id: args.mediaId } : {}),
    ...(args.voice ? { voice: true } : {}),
  },
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
