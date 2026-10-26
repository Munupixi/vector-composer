// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { parsePalette, parseSettings } from './composition';
import { paintComponent } from './paint';
import { exportComposition } from './export';
const palette = { name: 'Test', background: '#eeeeee', backgroundColors: ['#eeeeee'], objectColors: ['#ff0000'] };
describe('composition formats and palettes', () => {
  it('accepts only a background from the background palette', () => {
    expect(parsePalette(palette)).toEqual(palette);
    expect(() => parsePalette({ ...palette, background: '#ff0000' })).toThrow();
    expect(() => parsePalette({ ...palette, objectColors: ['url(https://example.com)'] })).toThrow();
    expect(() => parseSettings({ format: '__proto__', palette })).toThrow();
  });
  it('preserves geometry and opacity while applying role-specific colors', () => {
    const markup = '<path d="M1 2L3 4" fill="#000000" opacity="0.4"/>';
    const painted = paintComponent(markup, ['#000000'], palette);
    expect(painted).toContain('d="M1 2L3 4"'); expect(painted).toContain('opacity="0.4"');
    expect(painted).toContain('fill="#ff0000"');
    expect(paintComponent(markup, ['#000000'], palette, true)).toContain('fill="#eeeeee"');
    expect(paintComponent(markup, ['#000000'], null)).toBe(markup);
  });
  it('exports the selected format and background without raster images', () => {
    const output = exportComposition('Example', [], [], { format: 'portrait', palette });
    const svg = new DOMParser().parseFromString(output, 'image/svg+xml').documentElement;
    expect(svg.getAttribute('viewBox')).toBe('0 0 800 1200');
    expect(svg.querySelector('rect')?.getAttribute('fill')).toBe('#eeeeee');
    expect(svg.querySelector('image')).toBeNull();
  });
});
