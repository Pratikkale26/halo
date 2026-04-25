/**
 * Halo demo theme — minimal palette + spacing constants. Pre-brand pass; the
 * grant-deck designer can replace these once the brand identity is locked.
 */

export const theme = {
  colors: {
    bg: "#0B0B14",
    bgElevated: "#15141F",
    bgSubtle: "#1E1D2C",
    border: "#2C2A3D",
    text: "#F4F3FA",
    textMuted: "#9C9AB3",
    accent: "#7C5CFF", // Halo violet
    accentSoft: "#3B2D7A",
    danger: "#FF5C7A",
    dangerSoft: "#3D1620",
    success: "#3CD89A",
    successSoft: "#0F2E25",
    warning: "#FFB347",
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 6, md: 10, lg: 14, xl: 20 },
  text: {
    h1: { fontSize: 28, fontWeight: "700" as const },
    h2: { fontSize: 22, fontWeight: "600" as const },
    h3: { fontSize: 18, fontWeight: "600" as const },
    body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
    mono: { fontFamily: "Menlo", fontSize: 12 },
  },
};
