import type { Palette } from './composition';

// Exact slots from the three palette swatches supplied in the Figma library.
// Object paints may use background paints; composition backgrounds never use object-only paints.
export const originalPaints = ['#d7cdf5', '#aa9bf0', '#7864d7', '#f9ecb0', '#f9a3aa', '#ffe3e1', '#181817', '#ffffff'];
export const palettes: Palette[] = [
  { name: 'Лавандовая', background: '#d7cdf5', backgroundColors: ['#d7cdf5', '#aa9bf0', '#7864d7'], objectColors: originalPaints },
  { name: 'Персиковая', background: '#fdd7b9', backgroundColors: ['#fdd7b9', '#fac896', '#d27532'],
    objectColors: ['#fdd7b9', '#fac896', '#d27532', '#f9ecb0', '#80dada', '#beebeb', '#181817', '#ffffff'] },
  { name: 'Мятная', background: '#beebeb', backgroundColors: ['#beebeb', '#80dada', '#5abebe'],
    objectColors: ['#beebeb', '#80dada', '#5abebe', '#ffd4f2', '#6d7bfc', '#b6c6fe', '#181817', '#ffffff'] },
];
