import { readdir } from "node:fs/promises";

import type { Apps, ItemInfo } from "./type.ts";
import { readVersionCache } from "./utils/cache.ts";
import { fromRoot, isDirectory, isFile } from "./utils/fs.ts";
import { bold, cyan, dim, green, log, step, yellow } from "./utils/log.ts";

// ---------------------------------------------------------------------------
// Step 3 — compare the versions found on GitHub with the cached ones and decide
// which apps have to be downloaded again.
// ---------------------------------------------------------------------------

/** Fills in `need_to_update` for every app and sets `apps.updated`. */
export async function checkUpdates(apps: Apps): Promise<void> {
  step(3, 8, "Compare with the local cache");

  const versionsFile = fromRoot(apps.root, apps.config.cache.versions);
  const cache = await readVersionCache(versionsFile);
  apps.list.forEach((item) => {
    item.cached_version = cache.apps[item.folder]?.version;
  });

  let outdated = 0;
  for (const item of apps.list) {
    if (item.artifact_version === undefined) {
      item.need_to_update = false;
      continue;
    }
    const indexFile = fromRoot(
      apps.root,
      apps.config.cache.folder,
      item.folder,
      item.index,
    );
    const cached = item.cached_version;
    const complete = cached !== undefined && (await isFile(indexFile));
    item.need_to_update = !complete || cached !== item.artifact_version;
    if (item.need_to_update) outdated += 1;

    const from = complete ? bold(cached ?? "?") : yellow("none");
    const to = bold(item.artifact_version);
    const mark = item.need_to_update ? yellow("update") : green("cached");
    log(
      `  ${mark}  ${item.name.padEnd(14)} ${from} ${dim("->")} ${to}  ${
        dim(item.folder)
      }`,
    );
  }

  const deployIndex = fromRoot(apps.root, apps.config.deploy.index);
  const appList = fromRoot(apps.root, apps.config.deploy["app-list"]);
  const state = await inspectDeploy(apps, deployIndex, appList);
  if (state.missing.length > 0) {
    log(
      `  ${
        yellow("build")
      }  deploy folder misses ${state.missing.length} path(s): ${
        dim(state.missing.join(" "))
      }`,
    );
  }
  if (state.stale.length > 0) {
    log(
      `  ${
        yellow("clean")
      }  deploy folder has ${state.stale.length} unused path(s): ${
        dim(state.stale.join(" "))
      }`,
    );
  }
  for (const item of failedApps(apps)) {
    log(
      `  ${yellow("warn ")} ${item.name.padEnd(14)} ${
        dim(item.error ?? "not inspected")
      }, kept the deployed version`,
    );
  }

  apps.updated = outdated > 0 || state.rebuild;

  log("");
  log(
    `  ${cyan(`${outdated} of ${apps.list.length}`)} apps need a new download`,
  );
  log(`  cache    ${dim(apps.config.cache.folder)}`);
  log(
    `  ${
      apps.updated ? bold(green("work to do")) : bold(green("nothing to do"))
    }`,
  );
}

/** The paths the deploy folder has to contain: one folder per app and alias. */
function expectedPaths(apps: Apps): Set<string> {
  const names = new Set<string>();
  for (const item of apps.list) {
    names.add(item.folder);
    for (const alias of item.aliases) names.add(alias);
  }
  return names;
}

/**
 * Looks at what is already published. New apps, renamed folders and freshly
 * added aliases are picked up here, even when no app was released in between,
 * so a config change alone still triggers a rebuild.
 */
async function inspectDeploy(
  apps: Apps,
  deployIndex: string,
  appList: string,
): Promise<{ rebuild: boolean; missing: string[]; stale: string[] }> {
  const folder = fromRoot(apps.root, apps.config.deploy.folder);
  const expected = expectedPaths(apps);

  let present = new Set<string>();
  if (await isDirectory(folder)) {
    const entries = await readdir(folder, { withFileTypes: true });
    present = new Set(
      entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
    );
  }

  const missing = [...expected].filter((name) => !present.has(name));
  const stale = [...present].filter((name) => !expected.has(name));
  const rebuild = missing.length > 0 || stale.length > 0 ||
    !(await isFile(deployIndex)) || !(await isFile(appList));

  return { rebuild, missing, stale };
}

/** The apps that have to be downloaded, extracted and cached. */
export function pendingApps(apps: Apps): ItemInfo[] {
  return apps.list.filter((item) =>
    item.need_to_update && item.artifact_url !== undefined
  );
}

/** The apps that could not be inspected and are therefore left untouched. */
export function failedApps(apps: Apps): ItemInfo[] {
  return apps.list.filter((item) => item.artifact_name === undefined);
}
