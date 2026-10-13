import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Logging helpers.
//
// Everything goes to stdout, which makes the pipeline readable in the GitHub
// Actions log and easy to capture into a file when debugging locally, e.g.
// `node src/main.ts > logs/run.log 2>&1`.
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

/** Writes a chunk to stdout. */
function write(text: string): void {
	process.stdout.write(text);
}

/**
 * Writes a chunk that is meant to be overwritten in place, such as a download
 * progress bar. It is only useful on a terminal, so it is skipped when stdout
 * is captured into a file.
 */
function transient(text: string): void {
	if (process.stdout.isTTY === true) process.stdout.write(text);
}

/** Prints an ordinary line of output. */
export function log(message = ""): void {
	write(`${message}\n`);
}

/** Prints a line only when VERBOSE is enabled. */
export function debug(message: string): void {
	if (process.env.VERBOSE === "1") log(`${dim(`[debug] ${message}`)}`);
}

/** Prints the `n/total` counter used while walking through the app list. */
export function progress(current: number, total: number, label: string): void {
	log(`  ${cyan(`[${current}/${total}]`)} ${label}`);
}

/** Updates a progress bar in place. */
export function progressBar(text: string): void {
	transient(`\r          ${text}    `);
}

/** Erases a progress bar written by `progressBar`. */
export function clearProgressBar(): void {
	transient("\r          ");
}

/** Prints the banner of a pipeline step. */
export function step(index: number, total: number, title: string): void {
	log("");
	log(`${bold(blue(`Step ${index}/${total}`))} ${bold(title)} ${dim("─".repeat(Math.max(4, 56 - title.length)))}`);
}

/** Prints an error and exits with a non-zero status code. */
export function fail(message: string, error?: unknown): never {
	log(`${red("error")} ${message}`);
	if (error !== undefined) log(dim(describe(error)));
	process.exit(1);
}

/** Renders an error and everything that caused it. */
function describe(error: unknown): string {
	if (!(error instanceof Error)) return String(error);
	const lines = [error.stack ?? error.message];
	let cause: unknown = (error as { cause?: unknown }).cause;
	while (cause !== undefined && cause !== null) {
		lines.push(`  caused by: ${cause instanceof Error ? (cause.stack ?? cause.message) : String(cause)}`);
		cause = cause instanceof Error ? (cause as { cause?: unknown }).cause : undefined;
	}
	return lines.join("\n");
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
 * Uses the GITHUB_OUTPUT file when running inside Actions and prints the value
 * everywhere else, which keeps local runs readable.
 */
export async function setOutput(name: string, value: string): Promise<void> {
	log(`${dim(`output`)} ${name} = ${bold(value)}`);
	const file = process.env.GITHUB_OUTPUT;
	if (!file) return;
	mkdirSync(dirname(file), { recursive: true });
	appendFileSync(`${file}`, `${name}=${value}\n`, "utf8");
}

/** Appends a section to the job summary shown on the run page. */
export async function setSummary(markdown: string): Promise<void> {
	const file = process.env.GITHUB_STEP_SUMMARY;
	if (!file) return;
	mkdirSync(dirname(file), { recursive: true });
	appendFileSync(file, `${markdown}\n`, "utf8");
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
