import { readdir, rename } from "node:fs/promises";

import AdmZip from "adm-zip";

import { ensureDir, exists, isDirectory, listFiles } from "./fs.ts";

// ---------------------------------------------------------------------------
// Zip helpers. The published web bundles are plain zip archives that usually
// contain a single top level folder such as `photocraft-web-0.8.2/`.
// ---------------------------------------------------------------------------

/** Entries that never belong to a published bundle. */
const JUNK = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$|desktop\.ini$)/i;

/** Maximum number of directory levels walked while looking for the entry file. */
const MAX_DEPTH = 4;

export interface ExtractResult {
	/** Path of the directory the files were extracted into. */
	target: string;
	/** Every extracted file, relative to `target`. */
	files: string[];
}

/** Extracts an archive into `target`, skipping editor and macOS junk. */
export async function extractZip(archive: string, target: string): Promise<ExtractResult> {
	if (!(await exists(archive))) throw new Error(`archive not found: ${archive}`);
	await ensureDir(target);

	const zip = new AdmZip(archive);
	const files: string[] = [];
	for (const entry of zip.getEntries()) {
		const name = entry.entryName;
		if (entry.isDirectory || JUNK.test(name)) continue;
		// maintainEntryPath keeps the folder layout of the bundle inside `target`.
		zip.extractEntryTo(entry, target, true, true);
		files.push(name);
	}
	return { target, files };
}

/**
 * Walks down from `start` until the directory holding `indexFile` is found.
 * Archives are usually wrapped in a single `<app>-web-<version>/` folder.
 */
export async function findEntryFolder(start: string, indexFile: string): Promise<string | undefined> {
	let current = start;
	for (let depth = 0; depth <= MAX_DEPTH; depth += 1) {
		if (await exists(joinPath(current, indexFile))) return current;
		if (!(await isDirectory(current))) return undefined;
		const entries = (await readdir(current, { withFileTypes: true })).filter((entry) => entry.isDirectory());
		if (entries.length !== 1) return undefined;
		current = joinPath(current, entries[0]!.name);
	}
	return undefined;
}

/**
 * Returns the html file that acts as the entry point of a bundle: the
 * configured index file when present, otherwise the only html file at the root.
 */
export async function findHtmlEntry(folder: string, indexFile: string): Promise<string | undefined> {
	if (await exists(joinPath(folder, indexFile))) return indexFile;
	const files = (await listFiles(folder)).filter((file) => file.toLowerCase().endsWith(".html") && !file.includes("/"));
	return files.length === 1 ? files[0] : undefined;
}

/** Renames a file inside a folder, ignoring a rename onto itself. */
export async function renameEntry(folder: string, from: string, to: string): Promise<boolean> {
	if (from === to) return false;
	const source = joinPath(folder, from);
	const destination = joinPath(folder, to);
	if (!(await exists(source)) || (await exists(destination))) return false;
	await rename(source, destination);
	return true;
}

/** Joins a folder and an entry name using the zip separator. */
function joinPath(folder: string, name: string): string {
	return folder.endsWith("/") ? `${folder}${name}` : `${folder}/${name}`;
}
