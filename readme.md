<p align="center">
  <img alt="ArtCraft" src="https://getartcraft.com/artcraft-icon.svg" width="88">
</p>

<h1 align="center">ArtCraft · Online</h1>

<p align="center">
  <b>The Crafting Apps, running in your browser.</b>
</p>

<p align="center">
  PhotoCraft, VectorCraft, FilmCraft, LightCraft, PdfCraft, EffectCraft, DesignCraft, FigCraft,
  GridCraft, CADCraft, SoundCraft, WordCraft and DeckCraft are thirteen open-source creative tools
  written from scratch in pure Rust. Every one of them ships a WebAssembly build, and this
  repository collects those builds and publishes them as plain static web apps.
</p>

<p align="center">
  <a href="https://getartcraft.com/"><img alt="ArtCraft" src="https://img.shields.io/badge/artcraft-getartcraft.com-ff7a45?style=flat-square"></a>
  <a href="https://github.com/Wu-Yijun/ArtCraft"><img alt="This repository" src="https://img.shields.io/badge/deploy-Wu--Yijun%2FArtCraft-ff7a45?style=flat-square"></a>
  <a href="https://github.com/storytold"><img alt="Source" src="https://img.shields.io/badge/source-github.com%2Fstorytold-ff7a45?style=flat-square"></a>
  <a href="https://discord.gg/artcraft"><img alt="Discord" src="https://img.shields.io/badge/chat-discord.gg%2Fartcraft-5865f2?style=flat-square"></a>
</p>

<br>

<p align="center">
  <a href="https://Wu-Yijun.github.io/ArtCraft/">
    <img alt="ArtCraft — open the Crafting Apps in your browser" src="static/hero.svg" width="100%">
  </a>
</p>

<p align="center">
  <b>► <a href="https://Wu-Yijun.github.io/ArtCraft/">Open the apps in your browser</a> ◄</b>
</p>

## What this repository does

The apps themselves live in their own repositories under
[github.com/storytold](https://github.com/storytold). This repository is the *distributor*: every
day it asks GitHub which web build is the latest one, downloads only the bundles that changed, and
publishes them to GitHub Pages under a URL that is easy to remember.

```
src/main.ts  ──▶  deploy/index.html  ──▶  https://Wu-Yijun.github.io/ArtCraft/photoshop/
```

Nothing is built here and nothing is hosted here either: the output is plain HTML, JavaScript and
WebAssembly, copied straight out of the official release archives.

## The apps

Every app is served from a path named after the software it reimplements, and each of those paths
also answers to a handful of short aliases that redirect to it.

| App | Path | Aliases | Source | Latest |
| --- | --- | --- | --- | --- |
| **PhotoCraft** — image editing | [`/ArtCraft/photoshop/`](https://Wu-Yijun.github.io/ArtCraft/photoshop/) | `/photo/` `/ps/` `/pic/` `/image/` `/pixels/` | [storytold/photocraft](https://github.com/storytold/photocraft) | 0.8.2 |
| **VectorCraft** — vector illustration | [`/ArtCraft/illustrator/`](https://Wu-Yijun.github.io/ArtCraft/illustrator/) | `/vector/` `/ai/` `/draw/` `/svg/` | [storytold/vectorcraft](https://github.com/storytold/vectorcraft) | 0.10.0 |
| **FilmCraft** — video editing | [`/ArtCraft/premiere/`](https://Wu-Yijun.github.io/ArtCraft/premiere/) | `/film/` `/video/` `/pr/` `/movie/` | [storytold/filmcraft](https://github.com/storytold/filmcraft) | 0.7.2 |
| **LightCraft** — photo library and raw developer | [`/ArtCraft/lightroom/`](https://Wu-Yijun.github.io/ArtCraft/lightroom/) | `/light/` `/raw/` `/darkroom/` | [storytold/lightcraft](https://github.com/storytold/lightcraft) | 0.7.1 |
| **PdfCraft** — read, organize and secure PDFs | [`/ArtCraft/pdf/`](https://Wu-Yijun.github.io/ArtCraft/pdf/) | `/acrobat/` `/reader/` `/docs/` `/pdfedit/` | [storytold/pdfcraft](https://github.com/storytold/pdfcraft) | 0.7.1 |
| **EffectCraft** — motion graphics and VFX | [`/ArtCraft/aftereffects/`](https://Wu-Yijun.github.io/ArtCraft/aftereffects/) | `/effect/` `/ae/` `/motion/` `/vfx/` `/comp/` | [storytold/effectcraft](https://github.com/storytold/effectcraft) | 0.9.2 |
| **DesignCraft** — page layout and publishing | [`/ArtCraft/indesign/`](https://Wu-Yijun.github.io/ArtCraft/indesign/) | `/design/` `/layout/` `/id/` `/publish/` | [storytold/designcraft](https://github.com/storytold/designcraft) | 0.7.1 |
| **FigCraft** — interface design and prototyping | [`/ArtCraft/figma/`](https://Wu-Yijun.github.io/ArtCraft/figma/) | `/fig/` `/ui/` `/ux/` `/prototype/` | [storytold/figcraft](https://github.com/storytold/figcraft) | 0.5.1 |
| **GridCraft** — spreadsheets and data analysis | [`/ArtCraft/excel/`](https://Wu-Yijun.github.io/ArtCraft/excel/) | `/xls/` `/spreadsheets/` `/sheet/` `/table/` `/grid/` | [storytold/gridcraft](https://github.com/storytold/gridcraft) | 0.6.1 |
| **CADCraft** — computer-aided design and drafting | [`/ArtCraft/autocad/`](https://Wu-Yijun.github.io/ArtCraft/autocad/) | `/cad/` `/dwg/` `/draft/` | [storytold/cadcraft](https://github.com/storytold/cadcraft) | 0.6.2 |
| **SoundCraft** — audio recording, editing and mixing | [`/ArtCraft/audition/`](https://Wu-Yijun.github.io/ArtCraft/audition/) | `/sound/` `/audio/` `/music/` `/daw/` | [storytold/soundcraft](https://github.com/storytold/soundcraft) | 0.6.1 |
| **WordCraft** — word processing | [`/ArtCraft/word/`](https://Wu-Yijun.github.io/ArtCraft/word/) | `/doc/` `/writer/` `/rtf/` | [storytold/wordcraft](https://github.com/storytold/wordcraft) | 0.6.1 |
| **DeckCraft** — presentations and slide shows | [`/ArtCraft/powerpoint/`](https://Wu-Yijun.github.io/ArtCraft/powerpoint/) | `/slide/` `/deck/` `/ppt/` `/slides/` | [storytold/deckcraft](https://github.com/storytold/deckcraft) | 0.6.1 |

The versions above are the ones currently deployed; `deploy/apps.json` is the machine readable
version of the same list.

## How it works

`src/main.ts` runs nine steps, each one in its own file:

| Step | File | What it does |
| --- | --- | --- |
| 1 | `src/01-load-config.ts` | Reads `config.yaml`, validates the app list, compiles the release patterns. |
| 2 | `src/02-fetch-releases.ts` | Asks the GitHub API for the latest release of every app and picks the web bundle out of its assets. |
| 3 | `src/03-check-updates.ts` | Compares those versions with the cached ones. Without a change the run stops here. |
| 4 | `src/04-download-releases.ts` | Downloads only the bundles that are out of date. |
| 5 | `src/05-extract-releases.ts` | Unpacks each bundle, steps into the folder that holds the entry page and makes sure it is called `index.html`. |
| 6 | `src/06-update-cache.ts` | Replaces the cached copy of every updated app and records the versions in `versions.yaml`. |
| 7 | `src/07-copy-to-deploy.ts` | Copies every cached app into `deploy/`, dropping folders no app uses any more. |
| 8 | `src/08-write-entry-pages.ts` | Writes `deploy/apps.json` for the entry page and one redirect page per alias. |
| 9 | `src/09-app-icons.ts` | Publishes the official icon of the software each app reimplements and wires it into the cards and the head of the entry page. |

Shared helpers live in `src/utils/`: logging and GitHub Actions outputs (`log.ts`), file system
operations (`fs.ts`), HTTP requests with retries (`net.ts`), the release API and artifact matching
(`github.ts`), zip extraction (`zip.ts`), the version cache (`cache.ts`), the published file filter
(`bundle.ts`), icon normalisation (`svg.ts`) and the generated HTML (`html.ts`).

### Folders

| Folder | In git? | Contents |
| --- | --- | --- |
| `artcraft-apps/release/` | no | The downloaded release archives. |
| `artcraft-apps/extract/` | no | Freshly unpacked archives, one folder per app. |
| `artcraft-apps/dist/` | no | **The cache.** The publishable files of every app plus `versions.yaml`. |
| `deploy/` | only `index.html` | The static site that GitHub Pages serves. `apps.json` and the app folders are generated. |
| `static/` | yes | Assets that are not part of a build: the hero banner of this readme and the official software icons in [`static/icons/`](static/icons/README.md). |

The cache is what makes a run cheap: with the GitHub Actions cache in place, only the apps that were
actually released since the last run are downloaded again.

## Running it locally

Node 24 or newer is enough — the pipeline is plain TypeScript and runs directly on Node.

```sh
pnpm install
node src/main.ts
```

Add a GitHub token in a `.env` file next to `config.yaml` to raise the API rate limit from 60 to
5000 requests per hour:

```sh
# .env
GITHUB_TOKEN=github_pat_...
```

Useful flags of the environment:

| Variable | Effect |
| --- | --- |
| `GITHUB_TOKEN` | Token used for the release API and the downloads. |
| `VERBOSE=1` | Print additional debugging lines. |
| `NO_COLOR=1` | Disable coloured output. |

A long run prints a lot, so it is worth capturing the output instead of scrolling through a
terminal:

```sh
node src/main.ts > logs/run.log 2>&1
```

The pipeline exits with `0` and publishes nothing when every app is already up to date, and it sets
the `cacheUpdated`, `deployUpdated`, `updatedApps` and `totalApps` step outputs for the workflow.
`cacheUpdated` is `true` when at least one app was newly downloaded and cached; `deployUpdated` is `true`
when the deploy folder changed (new apps, removed apps, config changes, or new content). The workflow
uses `cacheUpdated` to decide whether to save the cache and `deployUpdated` to decide whether to publish.

### Formatting

The sources follow [deno fmt](https://deno.com/) defaults, so a single command keeps the whole
`src` tree consistent — no formatter dependency in `package.json`, just run it when you have Deno
installed:

```sh
deno fmt src
deno fmt --check src   # what CI would see
pnpm typecheck          # tsc --noEmit
```

## Adding an app

1. Find the repository of the app under [github.com/storytold](https://github.com/storytold) and
   check that its latest release contains a `<app>-web-<version>.zip` asset.
2. Add an entry to the `apps` list in `config.yaml`:

   ```yaml
     - name: ExampleCraft
       title: Photoshop
       folder: photoshop
       aliases:
         - photo
       baseurl: /ArtCraft/photoshop/
       github-repo: https://github.com/storytold/examplecraft
       home: https://getartcraft.com/apps/examplecraft
       icon: https://getartcraft.com/images/apps/examplecraft/icon.webp
       status: Early alpha
       description: One sentence about the app.
       release-pattern: |
         ^examplecraft-web-(\d+\.\d+\.\d+)\.zip$
         ^\w+-web-(.*)\.zip$
       index: index.html
   ```

   The patterns are tried in order; the first one that matches an asset name wins, and its first
   capture group becomes the version number. The last two patterns catch any future renaming.

3. Run `node src/main.ts`. The new app appears on the entry page and under its path and aliases.

Folders and aliases have to be unique across the whole list — the pipeline refuses to start when two
apps would fight over the same path. A config change alone — a new app, a new alias, a renamed path —
is enough to trigger a rebuild, even when no app was released in between: step 3 compares the paths
that `config.yaml` asks for with the ones the deploy folder actually contains.

## Deploying

`.github/workflows/deploy.yml` runs the pipeline on every push to `main`, once a day on the cron in
`config.yaml`, and on demand through `workflow_dispatch`. It restores the app cache, runs
`node src/main.ts`, saves the cache again and, when something changed, publishes `deploy/` to GitHub
Pages.

## Trademarks

Microsoft, Adobe, Autodesk and the other product names used above are trademarks or registered
trademarks of their respective owners. The apps here are independent, open-source, clean-room
reimplementations; they are not affiliated with, sponsored by or endorsed by those companies, and
the names are used only to describe the workflows the apps are compatible with.

## License

The code in this repository is released under the [MIT](LICENSE) license. The apps themselves are
published by the ArtCraft team under their own licenses — MIT and/or Apache-2.0 — and every bundle
keeps its licence files next to the code it was built from.
