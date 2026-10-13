import type { ReleaseInfo } from "../type.ts";
import { fetchJson } from "./net.ts";

// ---------------------------------------------------------------------------
// GitHub release helpers.
// ---------------------------------------------------------------------------

interface RawRelease {
  tag_name: string;
  name: string | null;
  published_at: string;
  html_url: string;
  assets?: {
    name: string;
    size: number;
    url: string;
    browser_download_url: string;
    content_type: string;
  }[];
}

/** Extracts `owner/repo` out of a repository URL. */
function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const match =
    /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+?)(?:\.git)?\/?$/i
      .exec(repoUrl.trim());
  if (match === null) {
    throw new Error(`not a GitHub repository URL: ${repoUrl}`);
  }
  const owner = match[1] as string;
  const repo = match[2] as string;
  return { owner, repo };
}

/** Normalises `owner/repo` into an API path prefix. */
function repoApiPath(repoUrl: string): string {
  const { owner, repo } = parseRepoUrl(repoUrl);
  return `/repos/${owner}/${repo}`;
}

/**
 * Queries the latest published release of a repository. Drafts and releases
 * without assets are skipped by the GitHub API itself when using `latest`.
 */
export async function getLatestRelease(repoUrl: string): Promise<ReleaseInfo> {
  const release = await fetchJson<RawRelease>(
    `https://api.github.com${repoApiPath(repoUrl)}/releases/latest`,
  );
  return {
    tag_name: release.tag_name,
    name: release.name ?? release.tag_name,
    published_at: release.published_at,
    html_url: release.html_url,
    assets: (release.assets ?? []).map((asset) => ({ ...asset })),
  };
}

/** Strips the `v` prefix and build metadata from a version string. */
export function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, "").split("+")[0] ?? "";
}

/**
 * Picks the web bundle out of a release using an ordered list of patterns.
 * Every pattern may expose one capture group; that group is the version.
 */
export function matchArtifact(
  names: string[],
  patterns: RegExp[],
): { name: string; version: string; pattern: RegExp } | undefined {
  for (const pattern of patterns) {
    for (const name of names) {
      const match = pattern.exec(name);
      if (match === null) continue;
      const version = match[1] ?? match[0];
      return { name, version: normalizeVersion(version), pattern };
    }
  }
  return undefined;
}
