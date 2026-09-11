function channel(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const v =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return {
    r: parseInt(v.slice(0, 2), 16) / 255,
    g: parseInt(v.slice(2, 4), 16) / 255,
    b: parseInt(v.slice(4, 6), 16) / 255,
  };
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export function apcaLc(fg: string, bg: string): number {
  const lum = (hex: string): number => {
    const { r, g, b } = hexToRgb(hex);
    return 0.2126729 * channel(r) + 0.7151522 * channel(g) + 0.072175 * channel(b);
  };
  let yTxt = lum(fg);
  let yBg = lum(bg);
  if (yBg <= 0.022) yBg += (0.022 - yBg) ** 1.414;
  if (yTxt <= 0.022) yTxt += (0.022 - yTxt) ** 1.414;
  if (Math.abs(yBg - yTxt) < 0.0005) return 0;
  if (yBg > yTxt) {
    const s = yBg ** 0.55 - yTxt ** 0.58;
    const c = s * 1.14;
    return c < 0.027 ? 0 : (c - 0.027) * 100;
  }
  const s = yBg ** 0.65 - yTxt ** 0.62;
  const c = s * 1.14;
  return c > -0.027 ? 0 : (c + 0.027) * 100;
}
