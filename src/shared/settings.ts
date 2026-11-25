const ANIMS = ['slide-left', 'slide-right', 'slide-up', 'slide-down', 'fade', 'pop', 'none'] as const;
export type Anim = (typeof ANIMS)[number];

const ALIGNS = ['left', 'center', 'right'] as const;
export type Align = (typeof ALIGNS)[number];

export interface Channels {
  twitch: string;
  kick: string;
  kickroom: string;
  kickuid: string;
  yt: string;
  ytkey: string;
}

export interface Look {
  iconTwitch: boolean;
  iconKick: boolean;
  iconYoutube: boolean;
  bots: boolean;
  hidecmd: boolean;
  caps: boolean;
  shadow: number;
  badges: boolean;
  fixcolors: boolean;
  stv: boolean;
  bttv: boolean;
  ffz: boolean;
  anim: Anim;
  align: Align;
  fade: number;
  size: number;
  stroke: number;
  topfade: number;
  font: string;
}

export type Settings = Channels & Look;

const DEFAULT_CHANNELS: Channels = { twitch: '', kick: '', kickroom: '', kickuid: '', yt: '', ytkey: '' };

const DEFAULT_LOOK: Look = {
  iconTwitch: true,
  iconKick: true,
  iconYoutube: true,
  bots: true,
  hidecmd: false,
  caps: false,
  shadow: 2,
  badges: true,
  fixcolors: false,
  stv: true,
  bttv: true,
  ffz: true,
  anim: 'slide-up',
  align: 'left',
  fade: 0,
  size: 22,
  stroke: 0,
  topfade: 0,
  font: 'Inter'
};

export const defaultSettings = (): Settings => ({ ...DEFAULT_CHANNELS, ...DEFAULT_LOOK });

type BoolKey = { [K in keyof Look]: Look[K] extends boolean ? K : never }[keyof Look];
type NumKey = { [K in keyof Look]: Look[K] extends number ? K : never }[keyof Look];

const ICON_KEYS = { twitch: 'iconTwitch', kick: 'iconKick', youtube: 'iconYoutube' } as const;
const ICON_SET = new Set<string>(Object.values(ICON_KEYS));

const BOOL_KEYS = (Object.keys(DEFAULT_LOOK) as (keyof Look)[]).filter((k) => typeof DEFAULT_LOOK[k] === 'boolean' && !ICON_SET.has(k)) as BoolKey[];
const NUM_KEYS: NumKey[] = ['fade', 'size', 'stroke', 'shadow', 'topfade'];

function iconsToParam(s: Look): string | null {
  const on = (Object.keys(ICON_KEYS) as (keyof typeof ICON_KEYS)[]).filter((p) => s[ICON_KEYS[p]]);
  if (on.length === 3) return null;
  return on.length ? on.join(',') : '0';
}

function iconsFromParam(s: Look, v: string | null) {
  if (v == null || v === '' || v === '1') return;
  const on = v === '0' ? [] : v.toLowerCase().split(',').map((x) => x.trim());
  for (const [p, key] of Object.entries(ICON_KEYS)) s[key] = on.includes(p);
}

const param = (k: string) => (k === 'stv' ? '7tv' : k);

export function cleanChannel(input: string): string {
  return input.trim().replace(/^https?:\/\/(www\.)?(twitch\.tv|kick\.com)\//i, '').replace(/^[#@]/, '').split(/[/?#]/)[0].toLowerCase();
}

export function hasChannel(s: Channels): boolean {
  return Boolean(cleanChannel(s.twitch) || cleanChannel(s.kick) || s.yt.trim());
}

export function settingsToQuery(s: Settings): URLSearchParams {
  const q = new URLSearchParams();
  const twitch = cleanChannel(s.twitch);
  const kick = cleanChannel(s.kick);
  const yt = s.yt.trim();

  if (twitch) q.set('twitch', twitch);
  if (kick) {
    q.set('kick', kick);
    if (s.kickroom.trim()) q.set('kickroom', s.kickroom.trim());
    if (s.kickuid.trim()) q.set('kickuid', s.kickuid.trim());
  }
  if (yt) {
    q.set('yt', yt);
    if (s.ytkey.trim()) q.set('ytkey', s.ytkey.trim());
  }

  const icons = iconsToParam(s);
  if (icons) q.set('platform', icons);
  for (const k of BOOL_KEYS) if (s[k] !== DEFAULT_LOOK[k]) q.set(param(k), s[k] ? '1' : '0');
  if (s.anim !== DEFAULT_LOOK.anim) q.set('anim', s.anim);
  if (s.align !== DEFAULT_LOOK.align) q.set('align', s.align);
  for (const k of NUM_KEYS) if (s[k] !== DEFAULT_LOOK[k]) q.set(k, String(s[k]));
  const font = s.font.trim();
  if (font && font !== DEFAULT_LOOK.font) q.set('font', font);
  return q;
}

export function settingsFromQuery(q: URLSearchParams): Settings {
  const s = defaultSettings();
  const str = (k: string) => (q.get(k) ?? '').trim();

  s.twitch = cleanChannel(str('twitch'));
  s.kick = cleanChannel(str('kick'));
  s.kickroom = str('kickroom');
  s.kickuid = str('kickuid');
  s.yt = str('yt');
  s.ytkey = str('ytkey');

  iconsFromParam(s, q.get('platform'));
  for (const k of BOOL_KEYS) if (q.has(param(k))) s[k] = q.get(param(k)) !== '0';
  for (const k of NUM_KEYS) {
    const v = parseFloat(str(k));
    if (Number.isFinite(v)) s[k] = v;
  }
  const anim = str('anim') === 'slide' ? 'slide-left' : str('anim');
  if ((ANIMS as readonly string[]).includes(anim)) s.anim = anim as Anim;
  if ((ALIGNS as readonly string[]).includes(str('align'))) s.align = str('align') as Align;
  if (str('font')) s.font = str('font');
  return s;
}