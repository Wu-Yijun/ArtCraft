# Official software icons

The official marks of the software each app reimplements, taken from
[Wikimedia Commons](https://commons.wikimedia.org). They are kept in the repository — instead of
being downloaded by the pipeline — so a build never depends on an image host.

| File | Software | Commons file |
| --- | --- | --- |
| `photoshop.svg` | Adobe Photoshop | [Adobe_Photoshop_CC_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_Photoshop_CC_icon.svg) |
| `illustrator.svg` | Adobe Illustrator | [Adobe_Illustrator_CC_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_Illustrator_CC_icon.svg) |
| `premiere.svg` | Adobe Premiere Pro | [Adobe_Premiere_Pro_CC_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_Premiere_Pro_CC_icon.svg) |
| `lightroom.svg` | Adobe Lightroom | [Adobe_Photoshop_Lightroom_CC_logo.svg](https://commons.wikimedia.org/wiki/File:Adobe_Photoshop_Lightroom_CC_logo.svg) |
| `pdf.svg` | Adobe Acrobat Reader | [Adobe_Acrobat_Reader_icon_(2020).svg](https://commons.wikimedia.org/wiki/File:Adobe_Acrobat_Reader_icon_(2020).svg) |
| `aftereffects.svg` | Adobe After Effects | [Adobe_After_Effects_CC_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_After_Effects_CC_icon.svg) |
| `indesign.svg` | Adobe InDesign | [Adobe_Indesign_CC_2026_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_Indesign_CC_2026_icon.svg) |
| `excel.svg` | Microsoft Excel | [Microsoft_Office_Excel_(2025–present).svg](https://commons.wikimedia.org/wiki/File:Microsoft_Office_Excel_(2025–present).svg) |
| `autocad.svg` | Autodesk AutoCAD | [Autodesk_AutoCAD_Logo.svg](https://commons.wikimedia.org/wiki/File:Autodesk_AutoCAD_Logo.svg) |
| `audition.svg` | Adobe Audition | [Adobe_Audition_CC_2026_icon.svg](https://commons.wikimedia.org/wiki/File:Adobe_Audition_CC_2026_icon.svg) |
| `word.svg` | Microsoft Word | [Microsoft_Office_Word_(2025–present).svg](https://commons.wikimedia.org/wiki/File:Microsoft_Office_Word_(2025–present).svg) |
| `powerpoint.svg` | Microsoft PowerPoint | [Microsoft_Office_PowerPoint_(2025–present).svg](https://commons.wikimedia.org/wiki/File:Microsoft_Office_PowerPoint_(2025–present).svg) |
| `figma.svg` | Figma | [Figma-logo.svg](https://commons.wikimedia.org/wiki/File:Figma-logo.svg) |

The file name of every icon is the `folder` of the matching app in `config.yaml`, so the mapping is
one to one.

## Licensing

Each file keeps the licence of its Commons file page, linked in the table above. The Adobe "CC"
icons are published by Adobe for use that refers to the product, and the Microsoft, Autodesk and
Figma marks stay trademarks of their owners — they are used here only to name the software an app
works like. See [Trademarks](../readme.md#trademarks).

## Using them

The pipeline has no step for these icons yet: the entry page still shows the ArtCraft app icons
from `config.yaml`. When the icon step is added, it copies each file into `deploy/icons/<folder>.svg`
for the apps that were re-downloaded in that run and hands the path to the entry page. When ArtCraft
has prettier icons of its own, this folder can be deleted along with the step.