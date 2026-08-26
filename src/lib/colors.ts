/** Map human color names to swatch hexes for filter chips & product pills. */
export const COLOR_HEX: Record<string, string> = {
  Charcoal: "#2c2b30",
  Slate: "#4f4f51",
  Silver: "#d6d6d6",
  Blush: "#f2c4ce",
  Coral: "#f58f7c",
  Ivory: "#f4efe9",
  Sand: "#d8c7b0",
  Sage: "#a8b29a",
  Terracotta: "#c06a4b",
  Gold: "#c9a24b",
  Custom: "linear-gradient(135deg,#f58f7c,#f2c4ce,#c9a24b)",
};

export function colorSwatch(name: string): string {
  return COLOR_HEX[name] ?? "#d6d6d6";
}
