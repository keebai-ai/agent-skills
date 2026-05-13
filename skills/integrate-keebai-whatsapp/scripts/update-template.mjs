#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs, parseJsonFlag } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "update-template.mjs --id <template-id> [--components '<json-array>'] [--category <CAT>]",
  required: ["id"],
});

if (args.components === undefined && args.category === undefined) {
  process.stderr.write("error: pass at least one of --components / --category\n");
  process.exit(2);
}

const components = args.components !== undefined ? parseJsonFlag(args.components, "components") : undefined;

const client = loadClient();
const res = await client.templates.update(args.id, {
  ...(components !== undefined ? { components } : {}),
  ...(args.category ? { category: args.category } : {}),
});
printJson(res);
