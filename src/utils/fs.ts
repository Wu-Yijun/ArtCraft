import { constants } from "node:fs";
import { access, cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

// ---------------------------------------------------------------------------
// Small file system helpers shared by the pipeline steps.
// ---------------------------------------------------------------------------

/** Absolute path of a repository-relative path. */
export function fromRoot(root: string, ...parts: string[]): string {
	return resolve(root, ...parts);
}

/** True when the path exists (file or directory). */
export async function exists(path: string): Promise<boolean> {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

/** True when the path exists and is a directory. */
export async function isDirectory(path: string): Promise<boolean> {
	try {
		return (await stat(path)).isDirectory();
	} catch {
		return false;
	}
}

/** True when the path exists and is a regular file. */
export async function isFile(path: string): Promise<boolean> {
	try {
		return (await stat(path)).isFile();
	} catch {
		return false;
	}
}

/** Creates the directory and every missing parent. */
export async function ensureDir(path: string): Promise<void> {
	await mkdir(path, { recursive: true });
}

/** Creates the parent directory of a file. */
export async function ensureParent(path: string): Promise<void> {
	await ensureDir(dirname(path));
}

/** Removes a file or directory; missing paths are not an error. */
export async function remove(path: string): Promise<void> {
	await rm(path, { recursive: true, force: true });
}

/** Removes a directory and recreates it empty. */
export async function recreateDir(path: string): Promise<void> {
	await remove(path);
	await ensureDir(path);
}

/** Reads a UTF-8 text file. */
export async function readText(path: string): Promise<string> {
	return await readFile(path, "utf8");
}

/** Writes a UTF-8 text file, creating parent directories as needed. */
export async function writeText(path: string, text: string): Promise<void> {
	await ensureParent(path);
	await writeFile(path, text, "utf8");
}

/** Filter deciding whether a file takes part in a copy. */
export type CopyFilter = (absolutePath: string, relativePath: string) => boolean;

/**
 * Recursively copies `from` into `to`, creating the destination directory.
 * `filter` receives the source path and its path relative to `from`.
 */
export async function copyDir(from: string, to: string, filter?: CopyFilter): Promise<void> {
	if (!(await isDirectory(from))) {
		throw new Error(`not a directory: ${from}`);
	}
	await ensureDir(to);
	await cp(from, to, {
		recursive: true,
		force: true,
		dereference: true,
		filter: filter === undefined ? undefined : (source) => filter(source, toPosix(relative(from, source))),
	});
}

/** Lists every file below `dir`, as paths relative to `dir`. */
export async function listFiles(dir: string): Promise<string[]> {
	const found: string[] = [];
	async function walk(current: string, prefix: string): Promise<void> {
		const entries = await readdir(current, { withFileTypes: true });
		for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
			const next = join(current, entry.name);
			const relativePath = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
			if (entry.isDirectory()) {
				await walk(next, relativePath);
			} else if (entry.isFile() || entry.isSymbolicLink()) {
				found.push(relativePath);
			}
		}
	}
	await walk(dir, "");
	return found;
}

/** Every file below `dir`, relative to it, sorted alphabetically. */
export async function folderFiles(dir: string): Promise<string[]> {
	if (!(await isDirectory(dir))) return [];
	return await listFiles(dir);
}

/** Normalises a path to forward slashes, the separator used inside zip files. */
function toPosix(path: string): string {
	return sep === "/" ? path : path.split(sep).join("/");
}
