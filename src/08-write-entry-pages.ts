import type { AppListEntry, Apps } from "./type.ts";
import { fromRoot, isFile, recreateDir, writeText } from "./utils/fs.ts";
import { buildAppList, buildRedirectPage } from "./utils/html.ts";
import { bold, cyan, dim, green, log, step, yellow } from "./utils/log.ts";

// ---------------------------------------------------------------------------
// Step 8 — write the data behind deploy/index.html and the redirect pages that
// make the short alias paths of config.yaml work.
// ---------------------------------------------------------------------------

/** Builds the records consumed by deploy/index.html. */
export function buildEntries(apps: Apps): AppListEntry[] {
	return apps.list
		.filter((item) => item.deployed || item.cached_version !== undefined)
		.map((item) => ({
			name: item.name,
			title: item.title,
			description: item.description,
			url: item.baseurl,
			aliases: item.aliases,
			icon: item.icon,
			home: item.home,
			version: item.artifact_version ?? item.cached_version ?? "",
		}));
}

/** Writes deploy/apps.json. */
async function writeAppList(apps: Apps, entries: AppListEntry[]): Promise<void> {
	const path = fromRoot(apps.root, apps.config.deploy["app-list"]);
	await writeText(path, buildAppList(entries));
	log(`  ${green("written")} ${dim(apps.config.deploy["app-list"])} ${cyan(`(${entries.length} apps)`)}`);
}

/** Writes one redirect page per alias, so `/ArtCraft/photo/` reaches `/ArtCraft/photoshop/`. */
async function writeAliases(apps: Apps): Promise<string[]> {
	const deployFolder = fromRoot(apps.root, apps.config.deploy.folder);
	const written: string[] = [];
	for (const item of apps.list) {
		if (!item.deployed && item.cached_version === undefined) continue;
		for (const alias of item.aliases) {
			const folder = `${deployFolder}/${alias}`;
			await recreateDir(folder);
			await writeText(`${folder}/index.html`, buildRedirectPage({ alias, target: item.baseurl, name: item.name }));
			written.push(alias);
		}
	}
	log(`  ${green("written")} ${dim(String(written.length))} ${yellow("alias redirects")} ${cyan(written.join(" "))}`);
	return written;
}

/** Publishes the entry page data and every alias redirect page. */
export async function writeEntryPages(apps: Apps): Promise<void> {
	step(8, 8, "Write the entry page data");

	const entries = buildEntries(apps);
	if (entries.length === 0) throw new Error("no app was published, refusing to write an empty entry page");

	const indexPath = fromRoot(apps.root, apps.config.deploy.index);
	if (!(await isFile(indexPath))) throw new Error(`missing entry page: ${apps.config.deploy.index}`);

	await writeAppList(apps, entries);
	await writeAliases(apps);

	log("");
	log(`  ${bold(green("ready"))} ${dim(`${apps.config.deploy.index} serves ${cyan(String(entries.length))} apps`)}`);
}
