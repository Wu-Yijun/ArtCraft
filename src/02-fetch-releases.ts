import type { Apps, ItemInfo } from "./type.ts";
import { getLatestRelease, matchArtifact } from "./utils/github.ts";
import {
  bold,
  cyan,
  dim,
  group,
  log,
  progress,
  step,
  yellow,
} from "./utils/log.ts";

// ---------------------------------------------------------------------------
// Step 2 — ask GitHub for the latest release of every app and pick the web
// bundle out of its assets.
// ---------------------------------------------------------------------------

/** How many repositories are queried at the same time. */
const CONCURRENCY = 4;

/** Runs `task` over `items` with a bounded number of parallel workers. */
async function pool<T>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        await task(items[index] as T, index);
      }
    },
  );
  await Promise.all(workers);
}

async function inspect(
  item: ItemInfo,
  index: number,
  total: number,
): Promise<void> {
  progress(index + 1, total, `${bold(item.name)} ${dim(item.repo)}`);
  const release = await getLatestRelease(item.repo);
  item.release_tag = release.tag_name;
  item.release_url = release.html_url;
  item.published_at = release.published_at;

  const names = release.assets.map((asset) => asset.name);
  const artifact = matchArtifact(names, item.patterns);
  if (artifact === undefined) {
    item.error =
      `no web bundle in ${release.tag_name} (assets: ${names.length})`;
    log(`          ${yellow("warn")} ${item.error}`);
    return;
  }

  const asset = release.assets.find((candidate) =>
    candidate.name === artifact.name
  );
  item.artifact_name = artifact.name;
  item.artifact_url = asset?.browser_download_url;
  item.artifact_size = asset?.size;
  item.artifact_version = artifact.version === ""
    ? release.tag_name
    : artifact.version;
}

/** Fetches the latest release of every app and resolves its web bundle. */
export async function fetchReleases(apps: Apps): Promise<void> {
  step(2, 8, "Fetch latest releases from GitHub");
  const total = apps.list.length;

  await group(
    "release lookups",
    () =>
      pool(apps.list, CONCURRENCY, async (item, index) => {
        try {
          await inspect(item, index, total);
        } catch (error) {
          item.error = error instanceof Error ? error.message : String(error);
          log(`          ${yellow("warn")} ${item.name}: ${item.error}`);
        }
      }),
  );

  const ready = apps.list.filter((item) => item.artifact_name !== undefined);
  log("");
  for (const item of apps.list) {
    if (item.artifact_version === undefined) {
      log(
        `  ${yellow("skip")}  ${item.name.padEnd(14)} ${
          dim(item.error ?? "unknown error")
        }`,
      );
      continue;
    }
    log(
      `  ${cyan(item.artifact_version.padEnd(10))} ${item.name.padEnd(14)} ${
        dim(item.artifact_name ?? "")
      }`,
    );
  }
  if (ready.length === 0) {
    throw new Error("GitHub returned no usable release for any app");
  }
}
