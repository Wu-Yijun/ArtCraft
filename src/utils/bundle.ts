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
