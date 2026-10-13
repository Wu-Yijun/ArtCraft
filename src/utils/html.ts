import type { AppListEntry } from "../type.ts";

// ---------------------------------------------------------------------------
// Small HTML generators: the short-path redirect pages and the JSON payload
// consumed by deploy/index.html.
// ---------------------------------------------------------------------------

/** Escapes a string for use inside a double quoted HTML attribute. */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/** Escapes a string for use in HTML text content. */
export function escapeText(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Builds the page served from a short alias path such as `/ArtCraft/photo/`.
 * GitHub Pages is a static host, so the redirect is done with a canonical link,
 * a meta refresh and a script fallback.
 */
export function buildRedirectPage(options: { alias: string; target: string; name: string }): string {
	const { alias, target, name } = options;
	const title = escapeHtml(`${name} — redirecting`);
	const to = escapeHtml(target);
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0; url=${to}">
<link rel="canonical" href="${to}">
<title>${title}</title>
<style>
  html, body { margin: 0; height: 100%; background: #14151a; color: #e8e9ee;
    font: 15px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  body { display: flex; align-items: center; justify-content: center; }
  main { text-align: center; }
  a { color: #7fb2ff; }
</style>
<script>location.replace(${JSON.stringify(target)});</script>
</head>
<body>
<main>
  <p><code>/${escapeText(alias)}/</code> moved.</p>
  <p><a href="${to}">Continue to ${escapeHtml(name)}</a></p>
</main>
</body>
</html>
`;
}

/** Serialises the app list written to deploy/apps.json. */
export function buildAppList(entries: AppListEntry[]): string {
	return `${JSON.stringify(entries, undefined, 2)}\n`;
}
