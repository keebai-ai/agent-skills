#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs, parseJsonFlag } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage:
    "create-template.mjs --name <template_name> --language <code> --category <UTILITY|MARKETING|AUTHENTICATION> --components '<json-array>'",
  required: ["name", "language", "category", "components"],
});

const components = parseJsonFlag(args.components, "components");
if (!Array.isArray(components)) {
  process.stderr.write("error: --components must be a JSON array\n");
  process.exit(2);
}

const client = loadClient();
const res = await client.templates.create({
  name: args.name,
  language: args.language,
  category: args.category,
  components,
});
printJson(res);
