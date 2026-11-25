import { settingsFromQuery, type Look } from '../shared/settings';
import { opt } from './options';

const root = document.documentElement;
const chat = document.getElementById('chat')!;
const stage = document.getElementById('stage')!;

const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
document.head.append(fontLink);
let loadedFont = '';

const filterStyle = document.createElement('style');
document.head.append(filterStyle);

function loadFont(name: string) {
  if (name === loadedFont) return;
  loadedFont = name;
  const family = encodeURIComponent(name).replace(/%20/g, '+');
  fontLink.onerror = () => {
    fontLink.onerror = null;
    fontLink.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  };
  fontLink.href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;700;800&display=swap`;
}

export function applyStyle() {
  root.style.setProperty('--size', opt.size + 'px');
  root.style.setProperty('--font', `'${opt.font.replace(/'/g, '')}', 'Inter', system-ui, sans-serif`);
  root.style.setProperty('--align', opt.align);
  loadFont(opt.font);

  chat.classList.toggle('caps', opt.caps);
  chat.classList.toggle('no-badges', !opt.badges);
  chat.classList.toggle('hide-icon-twitch', !opt.iconTwitch);
  chat.classList.toggle('hide-icon-kick', !opt.iconKick);
  chat.classList.toggle('hide-icon-youtube', !opt.iconYoutube);

  const fade = Math.min(Math.max(opt.topfade, 0), 90);
  const mask = fade > 0 ? `linear-gradient(to bottom, transparent 0%, #000 ${fade}%)` : '';
  stage.style.setProperty('-webkit-mask-image', mask);
  stage.style.setProperty('mask-image', mask);

  const shadows: string[] = [];
  if (opt.stroke > 0) {
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      shadows.push(`${(Math.cos(a) * opt.stroke).toFixed(2)}px ${(Math.sin(a) * opt.stroke).toFixed(2)}px 0 #000`);
    }
  }
  const sh = Math.min(Math.max(opt.shadow, 0), 5);
  if (sh > 0) shadows.push(`${sh}px ${sh}px ${sh * 2}px rgba(0,0,0,.85)`, `0 0 ${sh * 4}px rgba(0,0,0,.45)`);
  chat.style.textShadow = shadows.join(',');

  const filters: string[] = [];
  if (opt.stroke > 0) filters.push(`drop-shadow(0 0 ${Math.min(opt.stroke, 2)}px #000)`);
  if (sh > 0) filters.push(`drop-shadow(${sh}px ${sh}px ${sh * 1.5}px rgba(0,0,0,.6))`);
  filterStyle.textContent = filters.length ? `.emote>img,.plat,.badge{filter:${filters.join(' ')}}` : '';
}

const LIVE_KEYS = [
  'iconTwitch', 'iconKick', 'iconYoutube', 'bots', 'hidecmd', 'caps', 'shadow', 'badges', 'fixcolors',
  'anim', 'align', 'fade', 'size', 'stroke', 'topfade', 'font'
] as const satisfies readonly (keyof Look)[];

export function listenForLiveSettings() {
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent || e.data?.type !== 'lchat4u:settings' || typeof e.data.query !== 'string') return;
    const next = settingsFromQuery(new URLSearchParams(e.data.query));
    const target = opt as unknown as Record<string, unknown>;
    for (const k of LIVE_KEYS) target[k] = next[k];
    applyStyle();
  });
}