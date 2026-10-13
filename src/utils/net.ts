import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

import { ensureParent } from "./fs.ts";

// ---------------------------------------------------------------------------
// Network helpers: JSON requests, text requests and resumable downloads.
// ---------------------------------------------------------------------------

const USER_AGENT = "ArtCraft-Deploy (+https://github.com/Wu-Yijun/ArtCraft)";
const API_VERSION = "2026-03-10";
const RETRIES = 3;
const RETRY_DELAY_MS = 2_000;

export class HttpError extends Error {
	readonly status: number;
	readonly url: string;

	constructor(status: number, url: string, message: string) {
		super(message);
		this.name = "HttpError";
		this.status = status;
		this.url = url;
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function headersOf(extra?: Record<string, string>): Record<string, string> {
	const headers: Record<string, string> = {
		"user-agent": USER_AGENT,
		accept: "*/*",
		...extra,
	};
	const token = githubToken();
	if (token !== undefined && headers.authorization === undefined) {
		headers.authorization = `Bearer ${token}`;
	}
	return headers;
}

/** Headers required by the GitHub REST API. */
export function githubHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		accept: "application/vnd.github+json",
		"x-github-api-version": API_VERSION,
		"user-agent": "Node-Fetch-Actions",
	};
	const token = githubToken();
	if (token !== undefined) headers.authorization = `Bearer ${token}`;
	return headers;
}

/** The token used for API and asset requests, if one is configured. */
export function githubToken(): string | undefined {
	const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
	return token === undefined || token.trim() === "" ? undefined : token.trim();
}

/** Performs a request with a couple of retries on transient failures. */
async function request(url: string, init?: RequestInit): Promise<Response> {
	let lastError: unknown;
	for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
		try {
			const response = await fetch(url, { ...init, headers: headersOf(init?.headers as Record<string, string> | undefined), redirect: "follow" });
			if (response.ok) return response;
			if (response.status < 500 && response.status !== 429) {
				throw new HttpError(response.status, url, `GET ${url} -> ${response.status} ${response.statusText}`);
			}
			lastError = new HttpError(response.status, url, `GET ${url} -> ${response.status} ${response.statusText}`);
		} catch (error) {
			lastError = error;
		}
		if (attempt < RETRIES) await sleep(RETRY_DELAY_MS * attempt);
	}
	throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Downloads a URL and parses the response as JSON. */
export async function fetchJson<T>(url: string): Promise<T> {
	const response = await request(url, { headers: githubHeaders() });
	return (await response.json()) as T;
}

/** Downloads a URL and returns the response as text. */
export async function fetchText(url: string): Promise<string> {
	const response = await request(url);
	return await response.text();
}

/** Called with the number of bytes already written. */
export type DownloadReporter = (received: number, total: number) => void;

/**
 * Streams a URL into a file. The callback is throttled by the caller so it can
 * report progress without flooding the log.
 */
export async function downloadFile(url: string, target: string, onProgress?: DownloadReporter): Promise<number> {
	await ensureParent(target);
	const response = await request(url);
	const total = Number(response.headers.get("content-length") ?? 0);
	if (response.body === null) throw new Error(`empty response body: ${url}`);

	let received = 0;
	const body = Readable.fromWeb(response.body as WebReadableStream<Uint8Array>);
	body.on("data", (chunk: Buffer) => {
		received += chunk.length;
		onProgress?.(received, total);
	});
	await pipeline(body, createWriteStream(target));
	return received;
}
