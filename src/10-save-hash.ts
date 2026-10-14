import type { Apps } from "./type.ts";
import { computeDeployHash } from "./utils/hash.ts";
import { fromRoot, writeText } from "./utils/fs.ts";
import { dim, green, log, step } from "./utils/log.ts";

// ---------------------------------------------------------------------------
// Step 10 — save the deploy hash so the next run can detect config changes
// by comparing hashes instead of relying on file existence.
// ---------------------------------------------------------------------------

export async function saveDeployHash(apps: Apps): Promise<void> {
  step(10, 10, "Save the deploy hash");

  const hash = await computeDeployHash(apps);
  const path = fromRoot(apps.root, apps.config.deploy["hash-file"]);
  await writeText(path, `${JSON.stringify(hash, undefined, 2)}\n`);

  log(`  ${green("saved")} ${dim(apps.config.deploy["hash-file"])}`);
  log("");
  log(`  ${green("done")} 10/10 steps finished`);
}
