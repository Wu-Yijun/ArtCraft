import type { Apps } from "./type.ts";
import { readVersionCache } from "./utils/cache.ts";
import { exists, fromRoot } from "./utils/fs.ts";
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
		const indexFile = fromRoot(apps.root, apps.config.cache.folder, item.folder, item.index);
		const cached = item.cached_version;
		const complete = cached !== undefined && (await exists(indexFile));
		item.need_to_update = !complete || cached !== item.artifact_version;
		if (item.need_to_update) outdated += 1;

		const from = complete ? bold(cached ?? "?") : yellow("none");
		const to = bold(item.artifact_version);
		const mark = item.need_to_update ? yellow("update") : green("cached");
		log(`  ${mark}  ${item.name.padEnd(14)} ${from} ${dim("->")} ${to}  ${dim(item.folder)}`);
	}

	const deployIndex = fromRoot(apps.root, apps.config.deploy.index);
	const appList = fromRoot(apps.root, apps.config.deploy["app-list"]);
	const deployReady = (await exists(deployIndex)) && (await exists(appList));
	if (!deployReady) log(`  ${yellow("build")}  deploy folder is incomplete, it will be rebuilt`);
	for (const item of failedApps(apps)) {
		log(`  ${yellow("warn ")} ${item.name.padEnd(14)} ${dim(item.error ?? "not inspected")}, kept the deployed version`);
	}

	apps.updated = outdated > 0 || !deployReady;

	log("");
	log(`  ${cyan(String(outdated))} of ${cyan(String(apps.list.length))} apps need a new download`);
	log(`  cache    ${dim(apps.config.cache.folder)}`);
	log(`  ${apps.updated ? bold(green("work to do")) : bold(green("nothing to do"))}`);
}

/** The apps that have to be downloaded, extracted and cached. */
export function pendingApps(apps: Apps) {
	return apps.list.filter((item) => item.need_to_update && item.artifact_url !== undefined);
}

/** The apps that could not be inspected and are therefore left untouched. */
export function failedApps(apps: Apps) {
	return apps.list.filter((item) => item.artifact_name === undefined);
}
