// src/app/core/utils/contrast.util.ts

export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Parses a hex string (#RGB, #RGBA, #RRGGBB, #RRGGBBAA) or rgb/rgba string into RGBA components.
 */
export function parseColor(color: string): RGBColor | null {
  if (!color || typeof color !== 'string') return null;
  const str = color.trim().toLowerCase();

  // Hex format
  if (str.startsWith('#')) {
    const hex = str.substring(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b, a: 1.0 };
    }
    if (hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = parseInt(hex[3] + hex[3], 16) / 255.0;
      return { r, g, b, a };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return { r, g, b, a: 1.0 };
    }
    if (hex.length === 8) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const a = parseInt(hex.substring(6, 8), 16) / 255.0;
      return { r, g, b, a };
    }
    return null;
  }

  // RGB/RGBA format
  const rgbMatch = str.match(/^rgba?\(\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*(?:,\s*([0-9.]+)\s*)?\)$/);
  if (rgbMatch) {
    const parseComponent = (val: string) => {
      if (val.endsWith('%')) {
        return Math.round((parseFloat(val) / 100.0) * 255.0);
      }
      return parseInt(val, 10);
    };
    const r = Math.min(255, Math.max(0, parseComponent(rgbMatch[1])));
    const g = Math.min(255, Math.max(0, parseComponent(rgbMatch[2])));
    const b = Math.min(255, Math.max(0, parseComponent(rgbMatch[3])));
    const a = rgbMatch[4] !== undefined ? Math.min(1.0, Math.max(0, parseFloat(rgbMatch[4]))) : 1.0;
    return { r, g, b, a };
  }

  return null;
}

/**
 * Composites a foreground color with alpha transparency over a solid background color.
 */
export function blendAlpha(fg: RGBColor, bg: RGBColor = { r: 255, g: 255, b: 255, a: 1.0 }): RGBColor {
  const alpha = fg.a;
  if (alpha >= 1.0) return { ...fg, a: 1.0 };
  const r = Math.round(fg.r * alpha + bg.r * (1 - alpha));
  const g = Math.round(fg.g * alpha + bg.g * (1 - alpha));
  const b = Math.round(fg.b * alpha + bg.b * (1 - alpha));
  return { r, g, b, a: 1.0 };
}

/**
 * Calculates WCAG 2.2 relative luminance for an RGB color using standard coefficients (0.2126, 0.7152, 0.0722).
 */
export function calculateRelativeLuminance(color: RGBColor): number {
  const adjust = (c: number) => {
    const srgb = c / 255.0;
    return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  const rLinear = adjust(color.r);
  const gLinear = adjust(color.g);
  const bLinear = adjust(color.b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculates WCAG 2.2 contrast ratio between two colors.
 */
export function calculateContrastRatio(fgInput: string | RGBColor, bgInput: string | RGBColor = '#ffffff'): number {
  const fgParsed = typeof fgInput === 'string' ? parseColor(fgInput) : fgInput;
  const bgParsed = typeof bgInput === 'string' ? parseColor(bgInput) : bgInput;

  if (!fgParsed || !bgParsed) return 1.0;

  const bgSolid = bgParsed.a < 1.0 ? blendAlpha(bgParsed, { r: 255, g: 255, b: 255, a: 1.0 }) : bgParsed;
  const fgSolid = fgParsed.a < 1.0 ? blendAlpha(fgParsed, bgSolid) : fgParsed;

  const l1 = calculateRelativeLuminance(fgSolid);
  const l2 = calculateRelativeLuminance(bgSolid);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}
