import type { Apps, ItemInfo } from "./type.ts";
import { pendingApps } from "./03-check-updates.ts";
import { fromRoot, recreateDir } from "./utils/fs.ts";
import { bold, cyan, dim, fail, green, humanSize, log, progress, step, yellow } from "./utils/log.ts";
import { extractZip, findEntryFolder, findHtmlEntry, renameEntry } from "./utils/zip.ts";

// ---------------------------------------------------------------------------
// Step 5 — unpack every downloaded bundle, step into the folder that holds the
// real files and make sure the entry point is called index.html.
// ---------------------------------------------------------------------------

/** Folder the archives are unpacked into, before they enter the cache. */
export const EXTRACT_FOLDER = "artcraft-apps/extract";

async function unpack(apps: Apps, item: ItemInfo, index: number, total: number): Promise<string> {
	const artifactName = item.artifact_name;
	if (artifactName === undefined) return "";

	const archive = fromRoot(apps.root, apps.config.download.folder, artifactName);
	const target = fromRoot(apps.root, EXTRACT_FOLDER, item.folder);
	progress(index, total, `${bold(item.name)} ${dim(artifactName)}`);

	await recreateDir(target);
	await extractZip(archive, target);

	const entryFolder = await findEntryFolder(target, item.index);
	if (entryFolder === undefined) {
		return fail(`cannot find "${item.index}" inside ${artifactName}; the bundle layout changed`);
	}

	const htmlEntry = await findHtmlEntry(entryFolder, item.index);
	if (htmlEntry === undefined) {
		return fail(`cannot find an html entry point inside ${artifactName}`);
	}
	if (htmlEntry !== item.index) {
		await renameEntry(entryFolder, htmlEntry, item.index);
		log(`          ${yellow("renamed")} ${dim(`${htmlEntry} -> ${item.index}`)}`);
	}

	item.source_folder = entryFolder;
	item.extracted = true;
	log(`          ${green("extracted")} ${dim(`${humanSize(item.artifact_size ?? 0)} -> ${item.index}`)}`);
	return entryFolder;
}

/** Unpacks every pending bundle and records where its entry folder is. */
export async function extractReleases(apps: Apps): Promise<void> {
	const pending = pendingApps(apps).filter((item) => item.downloaded);
	step(5, 8, "Extract bundles");

	if (pending.length === 0) {
		log(`  ${yellow("nothing")} to extract`);
		return;
	}
	log(`  folder   ${EXTRACT_FOLDER}`);

	const total = pending.length;
	for (const [index, item] of pending.entries()) {
		await unpack(apps, item, index + 1, total);
	}
	log("");
	log(`  ${green("done")} ${cyan(String(total))} bundles ready to cache`);
}
