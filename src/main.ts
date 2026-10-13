import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadConfig, STEP_TOTAL } from "./01-load-config.ts";
import { fetchReleases } from "./02-fetch-releases.ts";
import { checkUpdates, failedApps, pendingApps } from "./03-check-updates.ts";
import { downloadReleases } from "./04-download-releases.ts";
import { extractReleases } from "./05-extract-releases.ts";
import { updateCache } from "./06-update-cache.ts";
import { copyToDeploy } from "./07-copy-to-deploy.ts";
import { writeEntryPages } from "./08-write-entry-pages.ts";
import type { Apps } from "./type.ts";
import { blue, bold, cyan, dim, fail, green, group, log, setOutput, setSummary, yellow } from "./utils/log.ts";
import { loadEnv } from "./utils/env.ts";
import { githubToken } from "./utils/net.ts";

// ---------------------------------------------------------------------------
// ArtCraft deploy pipeline.
//
//   1. load config.yaml
//   2. ask GitHub for the latest release of every app and pick its web bundle
//   3. compare the versions with the cached ones, stop when nothing changed
//   4. download the bundles that are out of date
//   5. extract them and step into the folder holding the entry page
//   6. replace the cached copy of every updated app
//   7. copy every cached app into the deploy folder
//   8. write apps.json and the alias redirect pages used by the entry page
// ---------------------------------------------------------------------------

/** Repository root, derived from the location of this file. */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Markdown table shown on the GitHub Actions run page. */
function buildSummary(apps: Apps): string {
	const rows = apps.list
		.filter((item) => item.artifact_version !== undefined)
		.map(
			(item) =>
				`| ${item.name} | \`${item.folder}\` | ${item.artifact_version} | ${item.need_to_update ? "updated" : "cached"} |`,
		)
		.join("\n");
	return ["## ArtCraft deploy", "", "| App | Folder | Version | State |", "| --- | --- | --- | --- |", rows, ""].join("\n");
}

async function main(): Promise<void> {
	log(bold(blue("ArtCraft")) + dim(" · collect, cache and publish the Crafting Apps"));
	log(dim(`root      ${root}`));

	const envFile = loadEnv(root);
	const token = githubToken();
	log(
		dim(`token     `) +
			(token === undefined
				? yellow("none, the GitHub API is limited to 60 requests per hour")
				: `${green("loaded")} ${dim(token === process.env.GITHUB_TOKEN && envFile !== undefined ? "from .env" : "from the environment")}`),
	);

	const apps = await loadConfig(root);

	try {
		await fetchReleases(apps);
		await checkUpdates(apps);
	} catch (error) {
		fail("could not determine the available versions", error);
	}

	if (!apps.updated) {
		log("");
		log(green("up to date") + dim(` — nothing to do, ${apps.list.length} apps already cached`));
		await setOutput("hasUpdates", "false");
		await setOutput("updatedApps", "0");
		return;
	}

	const pending = pendingApps(apps);
	const unavailable = failedApps(apps);
	log("");
	log(bold("Work to do") + ` ${cyan(String(pending.length))} app(s) to update, ${cyan(String(unavailable.length))} unavailable`);

	try {
		await downloadReleases(apps);
		await extractReleases(apps);
		await updateCache(apps);
		await copyToDeploy(apps);
		await writeEntryPages(apps);
	} catch (error) {
		fail("deploy failed", error);
	}

	log("");
	log(yellow("changed") + dim(`  ${pending.length} app(s) updated`));
	for (const item of pending) {
		log(`         ${green(item.name.padEnd(14))} ${dim(`${item.cached_version ?? "none"} -> ${item.artifact_version ?? "?"}`)}`);
	}

	await group("job summary", () => setSummary(buildSummary(apps)));
	await setOutput("hasUpdates", "true");
	await setOutput("updatedApps", String(pending.length));
	await setOutput("totalApps", String(apps.list.length));

	log("");
	log(bold(green("done")) + dim(`  ${STEP_TOTAL}/${STEP_TOTAL} steps finished`));
}

if (import.meta.main) {
	await main();
}

export { main };
