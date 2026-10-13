import { existsSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Loads the repository local .env file into process.env.
//
// On CI the token comes from the workflow environment (secrets.GITHUB_TOKEN),
// so an existing environment variable always wins over the file.
// ---------------------------------------------------------------------------

/** Name of the file, relative to the repository root. */
const ENV_FILE = ".env";

/** Reads .env and fills in the variables that are not set yet. */
export function loadEnv(root: string): string | undefined {
  const path = resolve(root, ENV_FILE);
  if (!existsSync(path)) return undefined;
  try {
    // Node parses the file and only adds the missing variables.
    process.loadEnvFile(path);
  } catch {
    return undefined;
  }
  return path;
}
