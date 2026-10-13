// ---------------------------------------------------------------------------
// Shared types used by every step of src/main.ts.
// ---------------------------------------------------------------------------

/** The `website` block of config.yaml. */
export interface ConfigWebsiteInfo {
  title: string;
  tagline: string;
  description: string;
  url: string;
  baseurl: string;
  icon: string;
}

/** One entry of the `schedule` block of config.yaml. */
export interface ConfigScheduleInfo {
  cron: string;
}

/** The `deploy` block of config.yaml. */
export interface ConfigDeployInfo {
  folder: string;
  index: string;
  "app-list": string;
}

/** The `cache` block of config.yaml. */
export interface ConfigCacheInfo {
  folder: string;
  versions: string;
}

/** The `download` block of config.yaml. */
export interface ConfigDownloadInfo {
  folder: string;
}

/** One entry of the `apps` block of config.yaml. */
export interface ConfigAppInfo {
  name: string;
  title: string;
  folder: string;
  aliases: string[];
  baseurl: string;
  "github-repo": string;
  home: string;
  icon: string;
  "software-icon": string;
  "icon-crop": number;
  status: string;
  description: string;
  "release-pattern": string;
  index: string;
}

/** The whole config.yaml, after parsing and validating. */
export interface Config {
  website: ConfigWebsiteInfo;
  schedule: ConfigScheduleInfo[];
  deploy: ConfigDeployInfo;
  cache: ConfigCacheInfo;
  download: ConfigDownloadInfo;
  apps: ConfigAppInfo[];
}

/** An asset of a GitHub release, as far as this project cares about it. */
export interface ReleaseAsset {
  name: string;
  size: number;
  url: string;
  browser_download_url: string;
  content_type: string;
}

/** The latest release of a repository, as far as this project cares about it. */
export interface ReleaseInfo {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  assets: ReleaseAsset[];
}

/** Everything the pipeline knows about a single app. */
export interface ItemInfo {
  // --- from config.yaml ----------------------------------------------------
  name: string;
  title: string;
  description: string;
  home: string;
  icon: string;
  software_icon?: string;
  icon_crop?: number;
  status: string;
  folder: string;
  baseurl: string;
  aliases: string[];
  repo: string;
  patterns: RegExp[];
  index: string;

  // --- from the cached versions.yaml --------------------------------------
  cached_version?: string;

  // --- from the latest GitHub release -------------------------------------
  release_tag?: string;
  release_url?: string;
  published_at?: string;
  artifact_name?: string;
  artifact_url?: string;
  artifact_size?: number;
  artifact_version?: string;

  // --- computed ------------------------------------------------------------
  source_folder?: string;
  error?: string;
  need_to_update: boolean;
  downloaded: boolean;
  extracted: boolean;
  cached: boolean;
  deployed: boolean;
}

/** The shared state passed from step to step. */
export interface Apps {
  config: Config;
  root: string;
  list: ItemInfo[];
  updated: boolean;
}

/** One record of deploy/apps.json, consumed by deploy/index.html. */
export interface AppListEntry {
  name: string;
  title: string;
  description: string;
  url: string;
  aliases: string[];
  icon: string;
  home: string;
  version: string;
}
