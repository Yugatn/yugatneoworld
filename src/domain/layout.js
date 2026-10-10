/** Map design-space coordinates to the current canvas size. */
export const DESIGN = { width: 1000, height: 560 };

export function scalePoint(x, y, canvasWidth, canvasHeight) {
  const w = Math.max(1, canvasWidth);
  const h = Math.max(1, canvasHeight);
  return {
    x: (x / DESIGN.width) * w,
    y: (y / DESIGN.height) * h
  };
}

export function scaleRadius(r, canvasWidth, canvasHeight) {
  const factor = Math.min(canvasWidth / DESIGN.width, canvasHeight / DESIGN.height);
  return Math.max(22, r * factor);
}

export function layoutObjects(objects, roomId, canvasWidth, canvasHeight) {
  return objects
    .filter((o) => o.roomId === roomId)
    .map((o) => {
      const p = scalePoint(o.x, o.y, canvasWidth, canvasHeight);
      return { ...o, x: p.x, y: p.y, r: scaleRadius(o.r || 40, canvasWidth, canvasHeight) };
    });
}

export function layoutPlaces(places, canvasWidth, canvasHeight) {
  return places.map((p) => {
    const pos = scalePoint(p.x, p.y, canvasWidth, canvasHeight);
    return { ...p, x: pos.x, y: pos.y };
  });
}
