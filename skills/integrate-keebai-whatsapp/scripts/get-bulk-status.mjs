#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "get-bulk-status.mjs --broadcast-id <id>",
  required: ["broadcast-id"],
});

const client = loadClient();
const res = await client.messages.getBulkStatus(args.broadcastId);
printJson(res);
