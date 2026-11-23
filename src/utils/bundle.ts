import { copyFile } from "node:fs/promises";
import { join, posix } from "node:path";

import { ensureParent, isFile, listFiles, readText } from "./fs.ts";

// ---------------------------------------------------------------------------
// Decides which files of an extracted bundle are actually published.
//
// A web bundle carries a few runtime assets (the html entry, the trunk js and
// wasm, icons and fonts) plus the licences and readme of the project. Only the
// runtime assets are copied into the cache and the deploy folder.
// ---------------------------------------------------------------------------

/** Files that are never needed at runtime. */
const EXCLUDED =
  /(^|\/)(LICENSE[^/]*|LICENCE[^/]*|NOTICE[^/]*|README[^/]*|HOSTING[^/]*|ATTRIBUTION[^/]*|CHANGELOG[^/]*|CONTRIBUTING[^/]*|CODE_OF_CONDUCT[^/]*|SECURITY[^/]*)$/i;

/** Extensions that are never needed at runtime. */
const EXCLUDED_EXTENSIONS =
  /\.(md|markdown|map|rs|toml|lock|ts|tsx|ya?ml|sh|ps1|bat|cmd)$/i;

/** True when a file, given by its bundle relative path, has to be published. */
export function isPublishableFile(relativePath: string): boolean {
  const name = relativePath.split("/").pop() ?? relativePath;
  if (EXCLUDED.test(relativePath)) return false;
  if (EXCLUDED_EXTENSIONS.test(name)) return false;
  return true;
}

/** Builds the filter used when copying a bundle into the cache. */
export function publishableFilter(): (
  absolutePath: string,
  relativePath: string,
) => boolean {
  return (_absolutePath, relativePath) => isPublishableFile(relativePath);
}

// ---------------------------------------------------------------------------
// Checks the ES module imports of a bundle. Some releases ship a shared asset
// directory (wasm-bindgen's `snippets/`) at the site root while the module that
// imports it lives in a sub folder such as `app/`. The browser then asks for
// `<sub folder>/snippets/...`, which the archive does not contain, and the app
// never starts. The root copy is byte-identical, so it can fill the gap.
// ---------------------------------------------------------------------------

/** Relative specifiers of static imports, re-exports and dynamic imports. */
const IMPORT_SPECIFIERS = [
  /\bfrom\s*["'](\.[^"']*)["']/g,
  /\bimport\s*["'](\.[^"']*)["']/g,
  /\bimport\s*\(\s*["'](\.[^"']*)["']\s*\)/g,
];

/** One unresolved or repaired import of a bundle. */
export interface ImportIssue {
  /** Module holding the specifier, relative to the bundle root. */
  module: string;
  /** Specifier as written, e.g. `./snippets/eframe-abc/inline0.js`. */
  specifier: string;
  /** File the module asks for, relative to the bundle root. */
  target: string;
  /** Root copy used to satisfy the import, when it was repaired. */
  source?: string;
}

export interface ImportReport {
  /** Imports satisfied by copying a bundle root asset next to the module. */
  repaired: ImportIssue[];
  /** Imports that point nowhere, even after the repair attempt. */
  missing: ImportIssue[];
}

/** Returns every relative specifier of a module, without duplicates. */
function specifiersOf(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of IMPORT_SPECIFIERS) {
    for (const match of text.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier !== undefined) found.add(specifier);
    }
  }
  return [...found];
}

/** Drops the query string and fragment of a specifier. */
function cleanSpecifier(specifier: string): string {
  return specifier.split(/[?#]/, 1)[0] ?? specifier;
}

/**
 * Verifies that every relative import of every published module resolves inside
 * the bundle. Missing files are copied from the same path at the bundle root
 * when that copy exists; the rest is returned as missing.
 */
export async function repairBundleImports(
  root: string,
): Promise<ImportReport> {
  const report: ImportReport = { repaired: [], missing: [] };
  const modules = (await listFiles(root)).filter((file) =>
    file.toLowerCase().endsWith(".js")
  );

  for (const module of modules) {
    const text = await readText(join(root, module));
    for (const specifier of specifiersOf(text)) {
      const clean = cleanSpecifier(specifier);
      const target = posix.normalize(posix.join(posix.dirname(module), clean));
      if (target === ".." || target.startsWith("../")) continue;
      if (await isFile(join(root, target))) continue;

      const shared = posix.normalize(clean.replace(/^\.\//, ""));
      if (
        shared !== "" && !shared.startsWith("..") &&
        (await isFile(join(root, shared)))
      ) {
        await ensureParent(join(root, target));
        await copyFile(join(root, shared), join(root, target));
        report.repaired.push({ module, specifier, target, source: shared });
      } else {
        report.missing.push({ module, specifier, target });
      }
    }
  }
  return report;
}
