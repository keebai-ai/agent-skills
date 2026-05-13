#!/usr/bin/env node
import { loadClient, printJson } from "./lib/client.mjs";
import { parseArgs } from "./lib/args.mjs";

const args = parseArgs(process.argv.slice(2), {
  usage: "send-location.mjs --to <e164> --latitude <num> --longitude <num> [--name <text>] [--address <text>] [--phone-number-id <id>]",
  required: ["to", "latitude", "longitude"],
});

const lat = Number.parseFloat(args.latitude);
const lng = Number.parseFloat(args.longitude);
if (Number.isNaN(lat) || Number.isNaN(lng)) {
  process.stderr.write("error: --latitude and --longitude must be numbers\n");
  process.exit(2);
}

const client = loadClient();
const res = await client.messages.sendLocation({
  to: args.to,
  location: {
    latitude: lat,
    longitude: lng,
    ...(args.name ? { name: args.name } : {}),
    ...(args.address ? { address: args.address } : {}),
  },
  ...(args.phoneNumberId ? { phoneNumberId: args.phoneNumberId } : {}),
});
printJson(res);
