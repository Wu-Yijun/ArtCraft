import type { Apps, ItemInfo } from "./type.ts";
import {
  ensureDir,
  fromRoot,
  isFile,
  readText,
  writeText,
} from "./utils/fs.ts";
import { dim, green, log, step, yellow } from "./utils/log.ts";
import { normalizeSvg } from "./utils/svg.ts";

// ---------------------------------------------------------------------------
// Step 9 — publish the official icon of the software every app reimplements.
//
// The icons live in the repository (static/icons), not on an image host, so a
// build never depends on a third party. An icon is replaced when its app was
// re-downloaded in this run, and added the first time it shows up.
//
// Delete config.yaml's `software-icon` keys, the static/icons folder and this
// file when ArtCraft has icons of its own.
// ---------------------------------------------------------------------------

/** Folder, inside the deploy folder, where the published icons end up. */
const ICON_FOLDER = "icons";

/** Markers of the generated block in the head of deploy/index.html. */
const MARK_START = "<!-- icons:start -->";
const MARK_END = "<!-- icons:end -->";

/** Copies the icon of one app into deploy/icons and returns its public path. */
async function publishIcon(
  apps: Apps,
  item: ItemInfo,
): Promise<string | undefined> {
  const configured = item.software_icon;
  if (configured === undefined || configured === "") return undefined;

  const source = fromRoot(apps.root, configured);
  if (!(await isFile(source))) {
    log(
      `  ${yellow("miss ")} ${item.name.padEnd(14)} ${
        dim(`${configured} does not exist`)
      }`,
    );
    return undefined;
  }

  const target = fromRoot(
    apps.root,
    apps.config.deploy.folder,
    ICON_FOLDER,
    `${item.folder}.svg`,
  );
  const publicPath = `${ICON_FOLDER}/${item.folder}.svg`;

  // Replace the icon of an app that was just updated, otherwise keep what is
  // already published.
  const published = await isFile(target);
  if (!published || item.cached === true) {
    const svg = normalizeSvg(await readText(source), item.icon_crop ?? 1);
    await writeText(target, svg);
    log(
      `  ${green("icon   ")} ${item.name.padEnd(14)} ${dim(publicPath)}`,
    );
  }
  return publicPath;
}

/** Points the entries of apps.json at the published icons. */
async function patchAppList(
  apps: Apps,
  icons: Map<string, string>,
): Promise<void> {
  if (icons.size === 0) return;
  const path = fromRoot(apps.root, apps.config.deploy["app-list"]);
  if (!(await isFile(path))) return;

  const entries = JSON.parse(await readText(path)) as {
    url: string;
    icon: string;
  }[];
  let changed = 0;
  for (const entry of entries) {
    const icon = icons.get(entry.url);
    if (icon === undefined || entry.icon === icon) continue;
    entry.icon = icon;
    changed += 1;
  }
  if (changed === 0) return;
  await writeText(path, `${JSON.stringify(entries, undefined, 2)}\n`);
  log(
    `  ${green("list   ")} ${
      dim(`${changed} card(s) now show the software icon`)
    }`,
  );
}

/** Every `<link rel="icon">` a bundle brings with it, so it can be replaced. */
const ICON_LINK = /<link\b[^>]*\brel=["']?icon["']?[^>]*>/gi;

/** Removes the generated block and the icon links the document already has. */
function clean(html: string, dropExisting: boolean): string {
  const block = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}\\s*`).exec(html);
  if (block !== null) html = html.replace(block[0], "");
  return dropExisting ? html.replace(ICON_LINK, "") : html;
}

/** Puts a generated block of link tags right before `</head>`. */
async function writeBlock(
  path: string,
  links: string[],
  html: string,
): Promise<void> {
  const block = `${MARK_START}\n${
    links.map((link) => `  ${link}`).join("\n")
  }\n${MARK_END}\n`;
  await writeText(path, html.replace("</head>", `${block}</head>`));
}

/** Adds the icon links to the head of the entry page when they are missing. */
async function injectHeadIcons(
  apps: Apps,
  icons: Map<string, string>,
): Promise<void> {
  if (icons.size === 0) return;
  const path = fromRoot(apps.root, apps.config.deploy.index);
  if (!(await isFile(path))) return;

  let html = await readText(path);
  if (!html.includes("</head>")) {
    log(`  ${yellow("miss ")} ${dim("no </head> in the entry page")}`);
    return;
  }

  // Drop a previous block first, so renamed apps cannot leave a stale link.
  html = clean(html, false);

  const links = [...icons.entries()].map(([url, icon]) => {
    const folder = url.split("/").filter((part) => part !== "")[1] ?? icon;
    return `<link rel="icon" type="image/svg+xml" href="${icon}" data-app="${folder}">`;
  });

  await writeBlock(path, links, html);
  log(
    `  ${green("head   ")} ${
      dim(`${icons.size} icon link(s) in ${apps.config.deploy.index}`)
    }`,
  );
}

/**
 * Points the head of an app at the icon of its software, so the browser tab
 * shows the right mark while the app runs. The link the bundle ships with is
 * replaced and the path is relative to the app folder.
 */
async function injectAppIcon(
  apps: Apps,
  item: ItemInfo,
  icon: string,
): Promise<void> {
  const path = fromRoot(
    apps.root,
    apps.config.deploy.folder,
    item.folder,
    item.index,
  );
  if (!(await isFile(path))) {
    log(
      `  ${yellow("miss ")} ${item.name.padEnd(14)} ${
        dim(`no ${item.index} in ${item.folder}/`)
      }`,
    );
    return;
  }

  let html = await readText(path);
  if (!html.includes("</head>")) {
    log(
      `  ${yellow("miss ")} ${item.name.padEnd(14)} ${
        dim(`no </head> in ${item.folder}/${item.index}`)
      }`,
    );
    return;
  }

  html = clean(html, true);

  // The app folder sits one level below the icons folder.
  const href = `../${icon}`;
  await writeBlock(path, [
    `<link rel="icon" type="image/svg+xml" href="${href}">`,
  ], html);
  log(
    `  ${green("head   ")} ${item.name.padEnd(14)} ${
      dim(`${item.folder}/${item.index} -> ${href}`)
    }`,
  );
}

/** Publishes every configured software icon and wires it into the entry page. */
export async function publishIcons(apps: Apps): Promise<void> {
  step(9, 9, "Publish the software icons");

  const icons = new Map<string, string>();
  for (const item of apps.list) {
    const icon = await publishIcon(apps, item);
    if (icon === undefined) continue;
    icons.set(item.baseurl, icon);
    // The card and the app page itself both point at the published icon.
    await injectAppIcon(apps, item, icon);
  }

  await ensureDir(fromRoot(apps.root, apps.config.deploy.folder, ICON_FOLDER));
  await patchAppList(apps, icons);
  await injectHeadIcons(apps, icons);

  log("");
  log(
    `  ${
      icons.size === apps.list.length ? green("done") : yellow("part")
    } ${icons.size} of ${apps.list.length} apps show the icon of their software`,
  );
}
