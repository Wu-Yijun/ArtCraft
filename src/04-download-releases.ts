import { stat } from "node:fs/promises";

import type { Apps, ItemInfo } from "./type.ts";
import { pendingApps } from "./03-check-updates.ts";
import { exists, fromRoot, remove } from "./utils/fs.ts";
import {
	bold,
	clearProgressBar,
	cyan,
	dim,
	green,
	humanSize,
	log,
	progress,
	progressBar,
	red,
	step,
	yellow,
} from "./utils/log.ts";
import { downloadFile } from "./utils/net.ts";

// ---------------------------------------------------------------------------
// Step 4 — download the web bundle of every app that is out of date.
// ---------------------------------------------------------------------------

/** Progress lines are refreshed at most every 400 ms. */
const PROGRESS_INTERVAL_MS = 400;

async function download(apps: Apps, item: ItemInfo, index: number, total: number): Promise<void> {
	const artifactName = item.artifact_name;
	const artifactUrl = item.artifact_url;
	if (artifactName === undefined || artifactUrl === undefined) return;

	const target = fromRoot(apps.root, apps.config.download.folder, artifactName);
	progress(index, total, `${bold(item.name)} ${dim(artifactName)}`);

	if ((await exists(target)) && item.artifact_size !== undefined && (await stat(target)).size === item.artifact_size) {
		item.downloaded = true;
		log(`          ${green("already downloaded")} ${dim(humanSize(item.artifact_size))}`);
		return;
	}
	await remove(target);

	let lastLine = 0;
	let percentage = -1;
	const received = await downloadFile(artifactUrl, target, (bytes, size) => {
		const now = Date.now();
		if (size > 0) {
			const next = Math.min(100, Math.floor((bytes / size) * 100));
			if (next === percentage) return;
			percentage = next;
			if (now - lastLine < PROGRESS_INTERVAL_MS && bytes !== size) return;
		}
		lastLine = now;
		const done = size > 0 ? `${Math.min(100, Math.floor((bytes / size) * 100))}%` : humanSize(bytes);
		progressBar(`${cyan(done.padStart(5))} ${dim(humanSize(bytes))}`);
	});
	clearProgressBar();
	log(`${green("downloaded")} ${dim(humanSize(received))} ${bold(item.name.padEnd(14))} ${dim(artifactName)}`);
	item.downloaded = true;
}

/** Downloads every pending web bundle into the download folder. */
export async function downloadReleases(apps: Apps): Promise<void> {
	const pending = pendingApps(apps);
	step(4, 8, "Download web bundles");

	if (pending.length === 0) {
		log(`  ${yellow("nothing")} to download`);
		return;
	}
	log(`  folder   ${apps.config.download.folder}`);
	log("");

	let done = 0;
	for (const [index, item] of pending.entries()) {
		try {
			await download(apps, item, index + 1, pending.length);
			done += 1;
		} catch (error) {
			// One unreachable repository must not stop the other apps; the
			// previous cached version stays in place and is published again.
			item.error = error instanceof Error ? error.message : String(error);
			clearProgressBar();
			log(`${" ".repeat(10)}${red("failed")} ${bold(item.name)} ${dim(item.error)}`);
		}
	}
	log("");
	log(`  ${green("done")} ${cyan(`${done}/${pending.length}`)} bundles in ${dim(apps.config.download.folder)}`);
}
