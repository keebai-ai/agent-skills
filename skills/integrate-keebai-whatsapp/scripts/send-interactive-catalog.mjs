#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage:
    "send-interactive-catalog.mjs --to <e164> --body <text> [--thumbnail-product-retailer-id <sku>] [--footer-text <text>] [--phone-number-id <id>]",
  required: ["to", "body"],
});

const client = loadClient();
const res = await client.messages.sendInteractiveCatalogMessage({
  to: args.to,
  bodyText: args.body,
  parameters: {
    ...(args.thumbnailProductRetailerId
      ? { thumbnailProductRetailerId: args.thumbnailProductRetailerId }
      : {}),
  },
  ...(args.footerText ? { footerText: args.footerText } : {}),
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
