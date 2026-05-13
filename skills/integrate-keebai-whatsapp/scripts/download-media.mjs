#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { loadClient } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "download-media.mjs --media-id <id> --out <path> [--phone-number-id <id>]",
  required: ["media-id", "out"],
});

const client = loadClient();
const ab = await client.media.download({
  mediaId: args.mediaId,
  as: "arraybuffer",
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});

await writeFile(args.out, Buffer.from(ab));
process.stdout.write(`Saved ${ab.byteLength} bytes to ${args.out}\n`);
