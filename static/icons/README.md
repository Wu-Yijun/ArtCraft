# Official software icons

The official marks of the software each app reimplements, taken from
[Wikimedia Commons](https://commons.wikimedia.org) and, for the Substance 3D apps, from Adobe's
[Substance 3D app icons](https://experienceleague.adobe.com/en/docs/substance-3d/general-knowledge/ecosystem/susbtance-3d-app-icons)
page. They are kept in the repository — instead of being downloaded by the pipeline — so a build
never depends on an image host.

| File | Software | Source |
| --- | --- | --- |
| `photoshop.svg` | Adobe Photoshop | [Adobe_Photoshop_CC_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_Photoshop_CC_icon.svg) |
| `illustrator.svg` | Adobe Illustrator | [Adobe_Illustrator_CC_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_Illustrator_CC_icon.svg) |
| `premiere.svg` | Adobe Premiere Pro | [Adobe_Premiere_Pro_CC_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_Premiere_Pro_CC_icon.svg) |
| `lightroom.svg` | Adobe Lightroom | [Adobe_Photoshop_Lightroom_CC_logo.svg](https://commons.wikimedia.org/wiki/File:Adobe_Photoshop_Lightroom_CC_logo.svg) |
| `pdf.svg` | Adobe Acrobat Reader | [Adobe_Acrobat_Reader_icon_(2020).svg](https://commons.wikimedia.org/wiki/File:Adobe_Acrobat_Reader_icon_(2020).svg) |
| `aftereffects.svg` | Adobe After Effects | [Adobe_After_Effects_CC_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_After_Effects_CC_icon.svg) |
| `indesign.svg` | Adobe InDesign | [Adobe_Indesign_CC_2026_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_Indesign_CC_2026_icon.svg) |
| `substancepainter.svg` | Adobe Substance 3D Painter | [Substance 3D app icons](https://experienceleague.adobe.com/en/docs/substance-3d/general-knowledge/ecosystem/susbtance-3d-app-icons) |
| `substancedesigner.svg` | Adobe Substance 3D Designer | [Substance 3D app icons](https://experienceleague.adobe.com/en/docs/substance-3d/general-knowledge/ecosystem/susbtance-3d-app-icons) |
| `substancesampler.svg` | Adobe Substance 3D Sampler | [Substance 3D app icons](https://experienceleague.adobe.com/en/docs/substance-3d/general-knowledge/ecosystem/susbtance-3d-app-icons) |
| `substancestager.svg` | Adobe Substance 3D Stager | [Substance 3D app icons](https://experienceleague.adobe.com/en/docs/substance-3d/general-knowledge/ecosystem/susbtance-3d-app-icons) |
| `substancemodeler.svg` | Adobe Substance 3D Modeler | [Substance 3D app icons](https://experienceleague.adobe.com/en/docs/substance-3d/general-knowledge/ecosystem/susbtance-3d-app-icons) |
| `excel.svg` | Microsoft Excel | [Microsoft_Office_Excel_(2025–present).svg](https://commons.wikimedia.org/wiki/File:Microsoft_Office_Excel_(2025–present).svg) |
| `autocad.svg` | Autodesk AutoCAD | [Autodesk_AutoCAD_Logo.svg](https://commons.wikimedia.org/wiki/File:Autodesk_AutoCAD_Logo.svg) |
| `audition.svg` | Adobe Audition | [Adobe_Audition_CC_2026_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_Audition_CC_2026_icon.svg) |
| `protools.svg` | Avid Pro Tools | [PT2019.svg](https://commons.wikimedia.org/wiki/File:PT2019.svg) |
| `word.svg` | Microsoft Word | [Microsoft_Office_Word_(2025–present).svg](https://commons.wikimedia.org/wiki/File:Microsoft_Office_Word_(2025–present).svg) |
| `powerpoint.svg` | Microsoft PowerPoint | [Microsoft_Office_PowerPoint_(2025–present).svg](https://commons.wikimedia.org/wiki/File:Microsoft_Office_PowerPoint_(2025–present).svg) |
| `figma.svg` | Figma | [Figma-logo.svg](https://commons.wikimedia.org/wiki/File:Figma-logo.svg) |

The file name of an icon is the `folder` of the app in `config.yaml` that reimplements the software,
so the mapping is one to one. The Substance 3D Sampler, Stager and Modeler marks are kept ahead of
their apps and use the same naming, ready for the day an app is added for them.

## Licensing

Each file keeps the licence of the source page linked in the table above. The Adobe "CC" icons and
the Substance 3D app icons are published by Adobe for use that refers to the product, and the
Microsoft, Autodesk and Figma marks stay trademarks of their owners — they are used here only to
name the software an app works like. See [Trademarks](../readme.md#trademarks).

## Using them

The pipeline publishes these icons in step 9 (`src/09-app-icons.ts`). For every app that carries a
`software-icon` key it copies `static/icons/<folder>.svg` to `deploy/icons/<folder>.svg`, the file
name being the app's `folder`. When `icon-viewbox` is set, the `viewBox`, `width` and `height` of
the copy are rewritten so the mark is trimmed; without the key the file is published untouched. A
missing source file is skipped and the app keeps the ArtCraft `icon` from `config.yaml`. A published
copy is only rewritten when its app was re-downloaded in that run, otherwise it is left in place.

The copies feed three places: the `apps.json` card of the entry page, the `<link rel="icon">`
favicon injected into every app page (relative to the app folder) and the `og:image` /
`twitter:image` card of that page. The Sampler, Stager and Modeler marks are not published yet
because no app uses them.

Delete the `software-icon` keys, this folder and step 9 once ArtCraft has prettier icons of its own.