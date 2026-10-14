import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import type { Apps } from "../type.ts";

export type DeployHash = Record<string, string>;

export function emptyDeployHash(): DeployHash {
  return {};
}

/** Computes SHA-256 hashes of the files listed in deploy.hashed-files. */
export async function computeDeployHash(apps: Apps): Promise<DeployHash> {
  const files = apps.config.deploy["hashed-files"] ?? [];
  const result: DeployHash = {};
  for (const file of files) {
    try {
      const content = await readFile(`${apps.root}/${file}`);
      result[file] = createHash("sha256").update(content).digest("hex");
    } catch {
      // missing file → no hash, will trigger a diff on next run
    }
  }
  return result;
}

export function diffDeployHash(
  before: DeployHash,
  after: DeployHash,
): { changed: boolean; details: string[] } {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const details: string[] = [];
  for (const key of keys) {
    if (before[key] !== after[key]) details.push(key);
  }
  return { changed: details.length > 0, details };
}
