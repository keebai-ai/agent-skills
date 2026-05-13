#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "upload-media.mjs --file <path> --type <mime> [--filename <name>] [--phone-number-id <id>]",
  required: ["file", "type"],
});

const buffer = await readFile(args.file);
const fileName = args.filename ?? basename(args.file);
const blob = new Blob([buffer], { type: args.type });

const client = loadClient();
const res = await client.media.upload({
  file: blob,
  fileName,
  type: args.type,
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
