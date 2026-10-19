// src/app/core/utils/contrast.util.spec.ts
import { parseColor, blendAlpha, calculateRelativeLuminance, calculateContrastRatio } from './contrast.util';

describe('ContrastUtil (WCAG 2.2 Relative Luminance & Contrast Calculation)', () => {

  it('should correctly parse 3, 4, 6, and 8 digit hex colors as well as rgb/rgba strings', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1.0 });
    expect(parseColor('#000f')).toEqual({ r: 0, g: 0, b: 0, a: 1.0 });
    expect(parseColor('#6d5742')).toEqual({ r: 109, g: 87, b: 66, a: 1.0 });
    expect(parseColor('#e74c3c80')).toEqual({ r: 231, g: 76, b: 60, a: 0.5019607843137255 });
    expect(parseColor('rgb(255, 255, 255)')).toEqual({ r: 255, g: 255, b: 255, a: 1.0 });
    expect(parseColor('rgba(0, 0, 0, 0.5)')).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
  });

  it('should correctly composite RGBA alpha colors over a solid background', () => {
    const fgHalfBlack = { r: 0, g: 0, b: 0, a: 0.5 };
    const bgWhite = { r: 255, g: 255, b: 255, a: 1.0 };
    const blended = blendAlpha(fgHalfBlack, bgWhite);
    expect(blended.r).toBe(128);
    expect(blended.g).toBe(128);
    expect(blended.b).toBe(128);
  });

  it('should calculate exact relative luminance according to WCAG 2.2 formulas', () => {
    expect(calculateRelativeLuminance({ r: 255, g: 255, b: 255, a: 1.0 })).toBeCloseTo(1.0, 4);
    expect(calculateRelativeLuminance({ r: 0, g: 0, b: 0, a: 1.0 })).toBeCloseTo(0.0, 4);
  });

  describe('Official WCAG 2.2 Contrast Ratio Assertions', () => {
    it('should calculate 21:1 contrast ratio for Black on White', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21.0, 1);
    });

    it('should calculate approximately 6.79:1 contrast ratio for White on #6d5742', () => {
      const ratio = calculateContrastRatio('#ffffff', '#6d5742');
      expect(ratio).toBeCloseTo(6.79, 1);
    });

    it('should calculate approximately 3.84:1 contrast ratio for White on #917f6e', () => {
      const ratio = calculateContrastRatio('#ffffff', '#917f6e');
      expect(ratio).toBeCloseTo(3.84, 1);
    });

    it('should calculate approximately 3.82:1 - 4.10:1 contrast ratio for White on #e74c3c', () => {
      const ratio = calculateContrastRatio('#ffffff', '#e74c3c');
      expect(ratio).toBeGreaterThanOrEqual(3.80);
      expect(ratio).toBeLessThanOrEqual(4.15);
    });

    it('should calculate approximately 5.12:1 - 5.50:1 contrast ratio for Black on #e74c3c', () => {
      const ratio = calculateContrastRatio('#000000', '#e74c3c');
      expect(ratio).toBeGreaterThanOrEqual(5.10);
      expect(ratio).toBeLessThanOrEqual(5.55);
    });
  });

});
