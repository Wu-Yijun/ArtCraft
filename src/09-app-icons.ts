import type { Apps, ItemInfo } from "./type.ts";
import {
  ensureDir,
  fromRoot,
  isFile,
  readText,
  writeText,
} from "./utils/fs.ts";
import { dim, green, log, step, yellow } from "./utils/log.ts";
import { applyViewBox } from "./utils/svg.ts";

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
const META_START = "<!-- artcraft:meta:start -->";
const META_END = "<!-- artcraft:meta:end -->";

function escapeAttribute(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(
    /</g,
    "&lt;",
  ).replace(/>/g, "&gt;");
}

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
    const svg = applyViewBox(await readText(source), item.icon_viewbox);
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
function clean(html: string): string {
  const block = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}\\s*`).exec(html);
  if (block !== null) html = html.replace(block[0], "");
  const meta = new RegExp(`${META_START}[\\s\\S]*?${META_END}\\s*`).exec(html);
  if (meta !== null) html = html.replace(meta[0], "");
  return html.replace(ICON_LINK, "");
}

/** Removes bundle metadata that the generated values replace. */
function cleanMetadata(html: string): string {
  const block = new RegExp(`${META_START}[\\s\\S]*?${META_END}\\s*`).exec(html);
  if (block !== null) html = html.replace(block[0], "");
  html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, "");
  html = html.replace(/<link\b[^>]*\brel=["']?canonical["']?[^>]*>/gi, "");
  return html.replace(/<meta\b[^>]*>/gi, (tag) =>
    /(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["']/i
      .test(tag)
      ? ""
      : tag
  );
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

  html = clean(html);

  // The app folder sits one level below the icons folder.
  const href = `../${icon}`;
  await writeBlock(
    path,
    [`<link rel="icon" type="image/svg+xml" href="${href}">`],
    html,
  );
  log(
    `  ${green("head   ")} ${item.name.padEnd(14)} ${
      dim(`${item.folder}/${item.index} -> ${href}`)
    }`,
  );
}

/** Adds search and social sharing metadata to every published app entry. */
async function injectAppMetadata(
  apps: Apps,
  item: ItemInfo,
  icon: string | undefined,
): Promise<void> {
  const path = fromRoot(apps.root, apps.config.deploy.folder, item.folder, item.index);
  if (!(await isFile(path))) return;
  let html = await readText(path);
  if (!html.includes("</head>")) return;

  html = cleanMetadata(html);
  const website = apps.config.website;
  const title = `${item.name} — ${item.title} online | ArtCraft`;
  const description = `${item.description} Use this free ${item.title} alternative online in your browser with ArtCraft.`;
  const canonical = `${website.url.replace(/\/+$/, "")}/${item.folder}/`;
  const image = icon === undefined
    ? item.icon
    : `${website.url.replace(/\/+$/, "")}/${icon}`;
  const attributes = [
    `<title>${escapeAttribute(title)}</title>`,
    `<meta name="description" content="${escapeAttribute(description)}">`,
    `<link rel="canonical" href="${escapeAttribute(canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${escapeAttribute(canonical)}">`,
    `<meta property="og:title" content="${escapeAttribute(title)}">`,
    `<meta property="og:description" content="${escapeAttribute(description)}">`,
    `<meta property="og:image" content="${escapeAttribute(image)}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${escapeAttribute(title)}">`,
    `<meta name="twitter:description" content="${escapeAttribute(description)}">`,
    `<meta name="twitter:image" content="${escapeAttribute(image)}">`,
  ];
  const block = `${META_START}\n${attributes.map((value) => `  ${value}`).join("\n")}\n${META_END}\n`;
  await writeText(path, html.replace("</head>", `${block}</head>`));
}

/**
 * Publishes every configured software icon: the cards of the entry page get
 * them through apps.json, and the page of each app gets its own favicon. The
 * entry page keeps the site icon in its head, a browser would only show one of
 * the links anyway.
 */
export async function publishIcons(apps: Apps): Promise<void> {
  step(9, 10, "Publish the software icons");

  const icons = new Map<string, string>();
  for (const item of apps.list) {
    const icon = await publishIcon(apps, item);
    if (icon === undefined) continue;
    icons.set(item.baseurl, icon);
    // The card and the app page itself both point at the published icon.
    await injectAppIcon(apps, item, icon);
    await injectAppMetadata(apps, item, icon);
  }

  // Metadata must still be present when an optional software icon is missing.
  for (const item of apps.list) {
    if (!icons.has(item.baseurl)) await injectAppMetadata(apps, item, undefined);
  }

  await ensureDir(fromRoot(apps.root, apps.config.deploy.folder, ICON_FOLDER));
  await patchAppList(apps, icons);

  log("");
  log(
    `  ${
      icons.size === apps.list.length ? green("done") : yellow("part")
    } ${icons.size} of ${apps.list.length} apps show the icon of their software`,
  );
}
