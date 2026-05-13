/**
 * Tiny CLI args parser. Supports:
 *   --flag value
 *   --flag=value
 *   --bool          (sets the flag to true)
 *   --help / -h     (prints the provided usage and exits 0)
 *
 * Usage:
 *   const args = parseArgs(process.argv.slice(2), {
 *     usage: "send-text.mjs --to <e164> --text <body> [--preview-url]",
 *     required: ["to", "text"],
 *     booleans: ["preview-url"],
 *   });
 */
export function parseArgs(argv, options = {}) {
  const { usage = "", required = [], booleans = [] } = options;
  const result = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      printUsage(usage);
      process.exit(0);
    }
    if (!token.startsWith("--")) {
      fail(`unexpected positional argument "${token}"`, usage);
    }
    const eqIdx = token.indexOf("=");
    let key;
    let value;
    if (eqIdx !== -1) {
      key = token.slice(2, eqIdx);
      value = token.slice(eqIdx + 1);
    } else {
      key = token.slice(2);
      if (booleans.includes(key)) {
        value = true;
      } else {
        const next = argv[i + 1];
        if (next === undefined || next.startsWith("--")) {
          fail(`flag --${key} is missing its value`, usage);
        }
        value = next;
        i += 1;
      }
    }
    result[camelize(key)] = value;
  }

  for (const req of required) {
    if (result[camelize(req)] === undefined) {
      fail(`missing required flag --${req}`, usage);
    }
  }

  return result;
}

export function parseJsonFlag(value, flagName) {
  if (value === undefined) {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    process.stderr.write(`error: --${flagName} must be valid JSON. ${err.message}\n`);
    process.exit(2);
  }
}

function camelize(key) {
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function printUsage(usage) {
  if (usage) {
    process.stdout.write(`Usage: ${usage}\n`);
  }
}

function fail(message, usage) {
  process.stderr.write(`error: ${message}\n`);
  if (usage) {
    process.stderr.write(`usage: ${usage}\n`);
  }
  process.exit(2);
}
