// ---------------------------------------------------------------------------
// A very small SVG helper.
//
// The official software logos come with wildly different canvases: most are
// square, the Figma logo is a tall rectangle and the AutoCAD logo is a wide
// lockup with a wordmark next to the mark. `icon-viewbox` in config.yaml says
// which part of the canvas to keep, so an icon can be trimmed to its mark.
//
// The file is only touched when the key is set: a logo that needs no trimming
// is published exactly as it was downloaded.
// ---------------------------------------------------------------------------

/** The four numbers of a `viewBox` attribute. */
export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Rounds a number the way an SVG editor would: no trailing zeros. */
function num(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** Parses `"x y width height"` as written in config.yaml. */
export function parseViewBox(text: string): ViewBox | undefined {
  const parts = text.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4) return undefined;
  if (parts.some((part) => !Number.isFinite(part))) return undefined;
  const [x, y, width, height] = parts as [number, number, number, number];
  if ((width ?? 0) <= 0 || (height ?? 0) <= 0) return undefined;
  return { x: x ?? 0, y: y ?? 0, width, height };
}

const VIEW_BOX = /viewBox\s*=\s*["'][^"']*["']/;
const WIDTH = /<svg\b[^>]*\swidth\s*=\s*["'][^"']*["']/;
const HEIGHT = /<svg\b[^>]*\sheight\s*=\s*["'][^"']*["']/;

/**
 * Replaces the viewBox of an SVG document with `viewBox` and gives the document
 * the matching width and height. Without a viewBox the document is returned
 * untouched, icons and their licences included.
 */
export function applyViewBox(svg: string, viewBox: string | undefined): string {
  if (viewBox === undefined || viewBox.trim() === "") return svg;
  const box = parseViewBox(viewBox);
  if (box === undefined) return svg;

  const value = `${num(box.x)} ${num(box.y)} ${num(box.width)} ${num(box.height)}`;
  let out = VIEW_BOX.test(svg)
    ? svg.replace(VIEW_BOX, `viewBox="${value}"`)
    : svg.replace(/<svg\b/, `<svg viewBox="${value}"`);

  const size = `${num(box.width)}`;
  out = WIDTH.test(out)
    ? out.replace(WIDTH, (match) => match.replace(/width\s*=\s*["'][^"']*["']/, `width="${size}"`))
    : out.replace(/<svg\b/, `<svg width="${size}"`);
  out = HEIGHT.test(out)
    ? out.replace(HEIGHT, (match) => match.replace(/height\s*=\s*["'][^"']*["']/, `height="${size}"`))
    : out.replace(/<svg\b/, `<svg height="${size}"`);

  return out;
}