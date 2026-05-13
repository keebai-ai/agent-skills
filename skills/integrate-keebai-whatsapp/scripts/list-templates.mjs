#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "list-templates.mjs [--limit <n>] [--cursor <token>]",
});

const limit = args.limit !== undefined ? Number.parseInt(args.limit, 10) : undefined;

const client = loadClient();
const res = await client.templates.list({
  ...(limit !== undefined ? { limit } : {}),
  ...(args.cursor ? { cursor: args.cursor } : {}),
});
printJson(res);
