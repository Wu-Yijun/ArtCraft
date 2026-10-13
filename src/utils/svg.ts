// ---------------------------------------------------------------------------
// A very small SVG helper.
//
// The official software logos have wildly different canvases: most are square,
// the Figma logo is a tall rectangle and the AutoCAD logo is a wide lockup with
// a wordmark next to the mark. Normalising them to one square viewBox keeps the
// entry page tidy: the artwork ends up centred in the box and every icon fills
// it the same way.
// ---------------------------------------------------------------------------

/** The four numbers of a `viewBox` attribute. */
export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A square viewBox, centred on the artwork of the original one. */
export function squareViewBox(box: ViewBox, crop: number): ViewBox {
  const kept = { ...box, width: box.width * Math.min(Math.max(crop, 0.01), 1) };
  const side = Math.max(kept.width, kept.height);
  return {
    x: kept.x + (kept.width - side) / 2,
    y: kept.y + (kept.height - side) / 2,
    width: side,
    height: side,
  };
}

/** Rounds a number the way an SVG editor would: no trailing zeros. */
function num(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** Reads the `viewBox` of an SVG document. */
export function readViewBox(svg: string): ViewBox | undefined {
  const match = svg.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (match === null) return undefined;
  const parts = (match[1] ?? "").trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return undefined;
  }
  const [x, y, width, height] = parts as [number, number, number, number];
  if (width <= 0 || height <= 0) return undefined;
  return { x: x ?? 0, y: y ?? 0, width, height };
}

/**
 * Returns the SVG with a square, centred viewBox. `crop` keeps only the leftmost
 * fraction of the canvas, which drops the wordmark of a wide logo. A document
 * without a usable viewBox is returned untouched.
 */
export function normalizeSvg(svg: string, crop = 1): string {
  const box = readViewBox(svg);
  if (box === undefined) return svg;
  const square = squareViewBox(box, crop);
  if (
    square.x === box.x && square.y === box.y && square.width === box.width &&
    square.height === box.height
  ) {
    return svg;
  }
  const viewBox = `${num(square.x)} ${num(square.y)} ${num(square.width)} ${
    num(square.height)
  }`;
  return svg.replace(/viewBox\s*=\s*["'][^"']+["']/, `viewBox="${viewBox}"`);
}
