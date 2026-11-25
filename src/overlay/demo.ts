import { pick } from '../shared/util';
import { kickDemoBadge, twitchBadges } from './badges';
import { kickColor, twitchColor, YT_COLORS } from './colors';
import { allMaps } from './emotes/store';
import { addMessage, isBot } from './render';
import type { Badge, Platform } from './types';

// Sample messages for the generator preview (?demo=1). Never part of the OBS URL.

const USERS: [Platform, string, string?][] = [
  ['twitch', 'Luna_Gamer', '#FF69B4'], ['kick', 'ElCapi', '#53FC18'], ['youtube', 'Sofi Plays'],
  ['twitch', 'xXSniperXx'], ['kick', 'Pancho_Live', '#FFC800'], ['twitch', 'NightOwl', '#9ACD32'],
  ['youtube', 'MateoGG'], ['twitch', 'Nightbot', '#00FF7F'], ['kick', 'Botrix', '#00C8FF'],
  ['twitch', 'pixelpanda'], ['twitch', 'Kairo_TV', '#FF4500'], ['kick', 'vexxy', '#FF4DBD'],
  ['youtube', 'Andrea R'], ['twitch', 'lowping_larry'], ['kick', 'turbo_tito', '#9ACD32'],
  ['twitch', 'MossyRock', '#2E8B57'], ['youtube', 'Diego Plays'],
];
const LINES = [
  'what a play', 'GG', 'lmao no way', 'hi from Brazil', '!discord', 'that clutch was insane',
  'hey chat', 'F', 'lets gooo', 'who else came from TikTok?', '!socials', "sisas", "omg", "HAH"
];

const KICK_LEVEL_SAMPLES = [
  'https://ext.cdn.kick.com/chat/badges/21_45650ac2-eab5-4ec8-a295-a939b4ef9f0f.png',
  'https://ext.cdn.kick.com/chat/badges/31_019f35ce-472a-74da-b3bc-69e3f2363639.png'
];

function randomEmote(): string {
  const maps = allMaps();
  if (!maps.length) return '';
  const names = [...pick(maps).values()].filter((e) => !e.zw).map((e) => e.name);
  return names.length ? pick(names) : '';
}

function tick() {
  const [platform, name, preset] = pick(USERS);
  let text = isBot(name) ? 'Follow us on all socials → link in the description' : pick(LINES);
  if (!text.startsWith('!') && Math.random() < 0.6) text += ' ' + randomEmote();
  if (Math.random() < 0.25) text = randomEmote() + ' ' + randomEmote();

  const r = Math.random();
  const badges: Badge[] = [];
  let owner = false;
  let color: string;
  if (platform === 'twitch') {
    const key = r < 0.15 ? 'moderator/1' : r < 0.25 ? 'vip/1' : r < 0.3 ? 'broadcaster/1' : '';
    const url = key && twitchBadges.get(key);
    if (url) badges.push({ url });
    color = twitchColor(preset, name.toLowerCase());
  } else if (platform === 'kick') {
    const type = r < 0.12 ? 'moderator' : r < 0.2 ? 'vip' : r < 0.26 ? 'og' : r < 0.4 ? 'subscriber' : '';
    if (Math.random() < 0.5) badges.push({ url: pick(KICK_LEVEL_SAMPLES), title: 'Level' });
    const badge = type && kickDemoBadge(type);
    if (badge) badges.push(badge);
    color = kickColor(preset);
  } else {
    if (r < 0.12) badges.push({ type: 'moderator' });
    else if (r < 0.25) badges.push({ type: 'member' });
    else if (r < 0.3) owner = true;
    color = r < 0.12 ? YT_COLORS.moderator : r < 0.25 ? YT_COLORS.member : YT_COLORS.normal;
  }

  addMessage({ platform, name, login: name, color, badges, owner, raw: text, parts: [{ t: 'text', v: text.trim() }] });
}

let rate = 0.6;
let timer = 0;

function schedule() {
  clearTimeout(timer);
  if (rate <= 0) return;
  const delay = (1000 / rate) * (0.4 + Math.random() * 1.2);
  timer = window.setTimeout(() => {
    tick();
    schedule();
  }, delay);
}

export function startDemo() {
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent || e.data?.type !== 'lchat4u:demo-rate') return;
    const next = Number(e.data.rate);
    if (!Number.isFinite(next) || next < 0 || next > 50) return;
    rate = next;
    schedule();
  });
  setTimeout(tick, 600);
  schedule();
}