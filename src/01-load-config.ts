import { parse } from "yaml";

import type { Apps, Config, ConfigAppInfo, ItemInfo } from "./type.ts";
import { fromRoot, readText } from "./utils/fs.ts";
import { fail, log, step } from "./utils/log.ts";

// ---------------------------------------------------------------------------
// Step 1 — load config.yaml and turn it into the pipeline state.
// ---------------------------------------------------------------------------

/** Relative path of the configuration file. */
export const CONFIG_FILE = "config.yaml";

function required<T>(value: T | undefined, field: string, where: string): T {
  if (
    value === undefined || value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    fail(`missing required field "${field}" in ${where}`);
  }
  return value;
}

function withSlashes(path: string): string {
  const trimmed = path.trim().replace(/\\/g, "/");
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

/** Compiles the multi line `release-pattern` block into ordered regular expressions. */
export function compilePatterns(block: string, where: string): RegExp[] {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
  if (lines.length === 0) fail(`"release-pattern" of ${where} is empty`);
  return lines.map((line, index) => {
    try {
      return new RegExp(line);
    } catch (error) {
      return fail(
        `invalid regular expression #${index + 1} of ${where}: ${line}`,
        error,
      );
    }
  });
}

function toItem(app: ConfigAppInfo): ItemInfo {
  return {
    name: app.name,
    title: app.title,
    description: app.description,
    home: app.home,
    icon: app.icon,
    status: app.status,
    folder: app.folder,
    baseurl: app.baseurl,
    aliases: app.aliases,
    repo: app["github-repo"],
    patterns: compilePatterns(app["release-pattern"], app.name),
    index: app.index,
    need_to_update: false,
    downloaded: false,
    extracted: false,
    cached: false,
    deployed: false,
  };
}

/** Rejects duplicate folders and aliases, they would collide on disk and in URLs. */
function checkUnique(apps: ItemInfo[]): void {
  const seen = new Map<string, string>();
  const claim = (key: string, owner: string): void => {
    const previous = seen.get(key);
    if (previous !== undefined) {
      fail(`"${key}" is used by both ${previous} and ${owner}`);
    }
    seen.set(key, owner);
  };
  for (const app of apps) {
    claim(app.folder, app.name);
    claim(withSlashes(app.baseurl).toLowerCase(), app.name);
    for (const alias of app.aliases) claim(alias, app.name);
  }
  for (const app of apps) {
    if (app.aliases.includes(app.folder)) {
      fail(`"${app.folder}" is listed as an alias of ${app.name}`);
    }
  }
}

/** Reads config.yaml, validates it and builds the shared state. */
export async function loadConfig(root: string): Promise<Apps> {
  const path = fromRoot(root, CONFIG_FILE);
  let config: Config;
  try {
    config = parse(await readText(path)) as Config;
  } catch (error) {
    return fail(`cannot read ${CONFIG_FILE}`, error);
  }

  const website = config.website ?? ({} as Config["website"]);
  const items = (config.apps ?? []).map((app) =>
    toItem({
      ...app,
      title: required(app.title ?? app.name, "title", app.name),
      folder: required(app.folder, "folder", app.name),
      aliases: app.aliases ?? [],
      baseurl: withSlashes(required(app.baseurl, "baseurl", app.name)),
      home: required(app.home, "home", app.name),
      icon: required(app.icon, "icon", app.name),
      status: app.status ?? "",
      description: required(app.description, "description", app.name),
      "github-repo": required(app["github-repo"], "github-repo", app.name),
      index: app.index ?? "index.html",
    })
  );

  if (items.length === 0) fail(`no apps defined in ${CONFIG_FILE}`);
  checkUnique(items);

  const state: Apps = {
    config: {
      website: {
        title: website.title ?? "ArtCraft",
        tagline: website.tagline ?? "",
        description: website.description ?? "",
        url: website.url ?? "",
        baseurl: withSlashes(website.baseurl ?? "/"),
        icon: website.icon ?? "",
      },
      schedule: config.schedule ?? [],
      deploy: {
        folder: config.deploy?.folder ?? "deploy",
        index: config.deploy?.index ?? "deploy/index.html",
        "app-list": config.deploy?.["app-list"] ?? "deploy/apps.json",
      },
      cache: {
        folder: config.cache?.folder ?? "artcraft-apps/dist",
        versions: config.cache?.versions ?? "artcraft-apps/dist/versions.yaml",
      },
      download: {
        folder: config.download?.folder ?? "artcraft-apps/release",
      },
      apps: (config.apps ?? []) as ConfigAppInfo[],
    },
    root,
    list: items,
    updated: false,
  };

  step(1, STEP_TOTAL, "Load configuration");
  log(`  config   ${CONFIG_FILE}`);
  log(
    `  website  ${state.config.website.title} ${state.config.website.baseurl}`,
  );
  log(`  apps     ${items.length} configured`);
  log(`  cache    ${state.config.cache.folder}`);
  log(`  deploy   ${state.config.deploy.folder}`);
  return state;
}

/** Total number of steps, used for the step banners. */
export const STEP_TOTAL = 8;
