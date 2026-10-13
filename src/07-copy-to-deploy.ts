import { readdir } from "node:fs/promises";

import type { Apps } from "./type.ts";
import {
  copyDir,
  fromRoot,
  isDirectory,
  recreateDir,
  remove,
} from "./utils/fs.ts";
import {
  bold,
  cyan,
  dim,
  green,
  log,
  progress,
  step,
  yellow,
} from "./utils/log.ts";

// ---------------------------------------------------------------------------
// Step 7 — copy every cached app into the deploy folder that GitHub Pages
// publishes, and drop folders that no longer belong to any app.
// ---------------------------------------------------------------------------

/** Directory names that must survive inside the deploy folder. */
function keepFolders(apps: Apps): Set<string> {
  const names = new Set<string>();
  for (const item of apps.list) {
    names.add(item.folder);
    for (const alias of item.aliases) names.add(alias);
  }
  return names;
}

/** Copies the cache into the deploy folder. */
export async function copyToDeploy(apps: Apps): Promise<void> {
  step(7, 8, "Copy apps into the deploy folder");

  const deployFolder = fromRoot(apps.root, apps.config.deploy.folder);
  log(`  folder   ${apps.config.deploy.folder}`);

  const total = apps.list.length;
  for (const [index, item] of apps.list.entries()) {
    progress(index + 1, total, `${bold(item.name)} ${dim(item.baseurl)}`);

    const source = fromRoot(apps.root, apps.config.cache.folder, item.folder);
    if (!(await isDirectory(source))) {
      log(`          ${yellow("skip")} nothing cached for this app`);
      continue;
    }
    const target = `${deployFolder}/${item.folder}`;
    await recreateDir(target);
    await copyDir(source, target);
    item.deployed = true;
    log(`          ${green("deployed")} ${dim(item.baseurl)}`);
  }

  const removed = await pruneDeploy(apps, deployFolder);
  if (removed.length > 0) {
    log(`  ${yellow("pruned")} ${removed.map((name) => dim(name)).join(", ")}`);
  }

  log("");
  log(
    `  ${green("done")} ${
      cyan(String(apps.list.filter((item) => item.deployed).length))
    } apps in ${dim(apps.config.deploy.folder)}`,
  );
}

/** Removes deploy sub folders that no app or alias uses any more. */
async function pruneDeploy(
  apps: Apps,
  deployFolder: string,
): Promise<string[]> {
  if (!(await isDirectory(deployFolder))) return [];
  const keep = keepFolders(apps);
  const removed: string[] = [];
  for (const entry of await readdir(deployFolder, { withFileTypes: true })) {
    if (!entry.isDirectory() || keep.has(entry.name)) continue;
    await remove(`${deployFolder}/${entry.name}`);
    removed.push(`${entry.name}/`);
  }
  return removed;
}
