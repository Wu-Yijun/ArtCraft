import { join } from "node:path";

import { pendingApps } from "./03-check-updates.ts";
import type { Apps, ItemInfo } from "./type.ts";
import { publishableFilter } from "./utils/bundle.ts";
import { readVersionCache, writeVersionCache } from "./utils/cache.ts";
import { copyDir, folderFiles, fromRoot, recreateDir } from "./utils/fs.ts";
import { bold, cyan, dim, green, log, progress, step, yellow } from "./utils/log.ts";

// ---------------------------------------------------------------------------
// Step 6 — move the extracted entry folder into the cache folder, replacing the
// previous version, and record the new versions in versions.yaml.
// ---------------------------------------------------------------------------

async function cacheApp(apps: Apps, item: ItemInfo, index: number, total: number): Promise<void> {
	const source = item.source_folder;
	progress(index, total, `${bold(item.name)} ${dim(item.folder)}`);
	if (source === undefined) return;

	// The cache only keeps what has to be published, so a new version always
	// replaces the previous one: no stale wasm or js files can survive.
	const target = fromRoot(apps.root, apps.config.cache.folder, item.folder);
	await recreateDir(target);
	await copyDir(source, target, publishableFilter());

	item.cached = true;
	log(`          ${green("cached")} ${dim(`${(await folderFiles(target)).length} files ready to publish`)}`);
}

/** Fills the cache with every freshly extracted bundle. */
export async function updateCache(apps: Apps): Promise<void> {
	const pending = pendingApps(apps).filter((item) => item.extracted);
	step(6, 8, "Update the app cache");

	const versionsFile = fromRoot(apps.root, apps.config.cache.versions);
	const cache = await readVersionCache(versionsFile);
	log(`  folder   ${apps.config.cache.folder}`);

	if (pending.length === 0) {
		log(`  ${yellow("nothing")} to cache`);
		return;
	}

	const total = pending.length;
	for (const [index, item] of pending.entries()) {
		await cacheApp(apps, item, index + 1, total);
		cache.apps[item.folder] = {
			version: item.artifact_version ?? "",
			tag: item.release_tag ?? "",
			artifact: item.artifact_name ?? "",
			published_at: item.published_at ?? "",
			cached_at: new Date().toISOString(),
		};
	}
	await writeVersionCache(versionsFile, cache);

	log("");
	log(`  ${green("done")} ${cyan(String(Object.keys(cache.apps).length))} apps in ${dim(apps.config.cache.folder)}`);
}

/** Absolute path of an app inside the cache folder. */
export function cachedAppFolder(apps: Apps, item: ItemInfo): string {
	return join(apps.root, apps.config.cache.folder, item.folder);
}
