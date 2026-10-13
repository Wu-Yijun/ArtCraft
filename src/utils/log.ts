import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Logging helpers.
//
// Everything is written to stderr-free stdout so the GitHub Actions log stays
// readable, and step outputs are additionally published through the workflow
// command / GITHUB_OUTPUT channels.
// ---------------------------------------------------------------------------

const COLOR = process.env.NO_COLOR ? false : process.stdout.isTTY === true;

function paint(code: number, text: string): string {
	return COLOR ? `\u001b[${code}m${text}\u001b[0m` : text;
}

export const bold = (text: string): string => paint(1, text);
export const dim = (text: string): string => paint(2, text);
export const red = (text: string): string => paint(31, text);
export const green = (text: string): string => paint(32, text);
export const yellow = (text: string): string => paint(33, text);
export const blue = (text: string): string => paint(34, text);
export const magenta = (text: string): string => paint(35, text);
export const cyan = (text: string): string => paint(36, text);

/** Prints an ordinary line of output. */
export function log(message = ""): void {
	process.stdout.write(`${message}\n`);
}

/** Prints a line only when VERBOSE is enabled. */
export function debug(message: string): void {
	if (process.env.VERBOSE === "1") {
		process.stdout.write(`${dim(`[debug] ${message}`)}\n`);
	}
}

/** Prints the `n/total` counter used while walking through the app list. */
export function progress(current: number, total: number, label: string): void {
	log(`  ${cyan(`[${current}/${total}]`)} ${label}`);
}

/** Prints the banner of a pipeline step. */
export function step(index: number, total: number, title: string): void {
	log("");
	log(`${bold(blue(`Step ${index}/${total}`))} ${bold(title)} ${dim("─".repeat(Math.max(4, 56 - title.length)))}`);
}

/** Prints an error and exits with a non-zero status code. */
export function fail(message: string, error?: unknown): never {
	log(`${red("error")} ${message}`);
	if (error !== undefined) {
		const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
		log(dim(detail));
	}
	process.exit(1);
}

/** Human readable byte size, e.g. `13.4 MB`. */
export function humanSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	return `${value.toFixed(1)} ${units[unit]}`;
}

/**
 * Publishes a step output so `.github/workflows/deploy.yml` can branch on it.
 * Uses the GITHUB_OUTPUT file when running inside Actions and degrades to a
 * plain `key=value` line everywhere else.
 */
export async function setOutput(name: string, value: string): Promise<void> {
	log(`${dim(`output`)} ${name} = ${bold(value)}`);
	const file = process.env.GITHUB_OUTPUT;
	if (!file) return;
	await mkdir(dirname(file), { recursive: true });
	await appendFile(file, `${name}=${value}\n`, "utf8");
}

/** Appends a section to the job summary shown on the run page. */
export async function setSummary(markdown: string): Promise<void> {
	const file = process.env.GITHUB_STEP_SUMMARY;
	if (!file) return;
	await mkdir(dirname(file), { recursive: true });
	await appendFile(file, `${markdown}\n`, "utf8");
}

/** Group of lines printed as a GitHub Actions log group, or plain text locally. */
export async function group<T>(title: string, body: () => Promise<T>): Promise<T> {
	if (process.env.GITHUB_ACTIONS === "true") {
		process.stdout.write(`::group::${title}\n`);
		try {
			return await body();
		} finally {
			process.stdout.write("::endgroup::\n");
		}
	}
	log(`${bold(title)}`);
	return await body();
}
