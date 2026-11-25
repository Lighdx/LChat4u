import { opt } from './options';

const TWITCH_DEFAULTS = [
  '#FF0000', '#0000FF', '#008000', '#B22222', '#FF7F50', '#9ACD32', '#FF4500', '#2E8B57',
  '#DAA520', '#D2691E', '#5F9EA0', '#1E90FF', '#FF69B4', '#8A2BE2', '#00FF7F'
];

export function twitchColor(tagColor: string | undefined, login: string): string {
  if (tagColor) return adjust(tagColor);
  const n = login.charCodeAt(0) + login.charCodeAt(login.length - 1);
  return adjust(TWITCH_DEFAULTS[n % TWITCH_DEFAULTS.length]);
}

export function kickColor(color: string | undefined): string {
  return adjust(color || '#FFFFFF');
}

export const YT_COLORS = { moderator: '#5E84F1', member: '#2BA640', normal: '#B3B3B3' } as const;

function adjust(hex: string): string {
  if (!opt.fixcolors) return hex;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum >= 0.35) return hex;
  const k = 0.45;
  r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k;
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}