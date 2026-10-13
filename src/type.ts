interface ConfigAppItemInfo {
  name: string;
  baseurl: string;
  "github-repo": string;
  "release-pattern": string;
  index: string;
}

interface ItemInfo {
  // load from config.yaml
  name: string;
  folder: string;
  baseurl: string;
  repo: string;
  patterns: RegExp[];
  index: string;
  // load from cached artcraft-apps/dist/versions.yaml
  version?: string;
  // load from github release info
  artifact_name: string;
  artifact_url: string;
  artifact_version: string;
  need_to_update: string;
}


interface Apps {
  list: ItemInfo[];
}