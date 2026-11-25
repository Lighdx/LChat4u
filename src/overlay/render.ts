import { PLATFORM_ICON } from '../shared/icons';
import { el } from '../shared/util';
import { BADGE_ICON } from './badges';
import { findEmote } from './emotes/store';
import { opt } from './options';
import type { ChatMessage, Emote, Part, Platform } from './types';

const chat = document.getElementById('chat')!;

const BOTS = new Set([
  'nightbot', 'streamelements', 'streamlabs', 'moobot', 'fossabot', 'wizebot', 'botrix', 'botrixoficial',
  'kickbot', 'sery_bot', 'soundalerts', 'streamlootsbot', 'pokemoncommunitygame', 'own3d', 'kofistreambot',
  'tangiabot', 'blerp', 'frostytoolsdotcom', 'commanderroot', 'creatisbot', 'lumiastream',
  ...opt.botnames.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)
]);
export const isBot = (login: string) => BOTS.has(login.toLowerCase());

const queue: ChatMessage[] = [];
let scheduled = false;

export function addMessage(m: ChatMessage) {
  if (opt.hidecmd && m.raw.trim().startsWith('!')) return;
  if (!opt.bots && isBot(m.login ?? m.name)) return;
  queue.push(m);
  if (queue.length > opt.max) queue.splice(0, queue.length - opt.max);
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(flush);
  }
}

function flush() {
  scheduled = false;
  const frag = document.createDocumentFragment();
  for (const m of queue.splice(0)) frag.append(buildRow(m));
  chat.append(frag);
  prune();
}

function prune() {
  while (chat.childElementCount > opt.max) chat.firstElementChild!.remove();
  const limit = window.innerHeight;
  while (chat.childElementCount > 1 && chat.offsetHeight - (chat.firstElementChild as HTMLElement).offsetHeight > limit) {
    chat.firstElementChild!.remove();
  }
}

export function removeWhere(test: (d: DOMStringMap) => boolean) {
  for (const row of [...chat.children] as HTMLElement[]) if (test(row.dataset)) row.remove();
}

function img(src: string, cls: string, alt = '') {
  const i = el('img', cls);
  i.src = src;
  i.alt = alt;
  i.decoding = 'async';
  i.onerror = () => i.remove();
  return i;
}

function emoteNode(host: HTMLElement, e: Emote, stackOn: HTMLElement | null): HTMLElement {
  if (e.zw && stackOn) {
    stackOn.append(img(e.url, '', e.name));
    return stackOn;
  }
  const wrap = el('span', 'emote');
  wrap.append(img(e.url, '', e.name));
  host.append(wrap);
  return wrap;
}

function appendParts(host: HTMLElement, parts: Part[], platform: Platform) {
  let last: HTMLElement | null = null;
  let buf = '';
  const flushText = () => {
    if (buf) host.append(buf);
    buf = '';
  };
  for (const p of parts) {
    if (p.t === 'emote') {
      flushText();
      last = emoteNode(host, p, null);
      continue;
    }
    for (const word of p.v.split(/(\s+)/)) {
      if (!word) continue;
      if (/^\s+$/.test(word)) { buf += word; continue; }
      const e = findEmote(word, platform);
      if (!e) { buf += word; last = null; continue; }
      if (e.zw && last) { buf = ''; emoteNode(host, e, last); }
      else { flushText(); last = emoteNode(host, e, null); }
    }
  }
  flushText();
}

function buildRow(m: ChatMessage): HTMLElement {
  const row = el('div', `msg${opt.anim !== 'none' ? ' anim-' + opt.anim : ''}${m.action ? ' action' : ''}`);
  row.dataset.p = m.platform;
  if (m.id) row.dataset.id = m.id;
  if (m.uid) row.dataset.uid = m.uid;

  const meta = el('span', 'meta');
  meta.append(img(PLATFORM_ICON[m.platform], 'plat', m.platform));
  const icons = BADGE_ICON[m.platform] ?? {};
  for (const b of m.badges) {
    if (b.url) meta.append(img(b.url, 'badge', b.title));
    else if (b.type && icons[b.type]) meta.append(img(icons[b.type], 'badge', b.type));
  }
  const name = el('span', m.owner ? 'name owner' : 'name', m.name);
  if (!m.owner) name.style.color = m.color;
  meta.append(name, m.action ? ' ' : el('span', 'sep', ':'));
  row.append(meta);

  const text = el('span', 'text');
  if (m.action) text.style.color = m.color;
  appendParts(text, m.parts, m.platform);
  row.append(text);

  if (opt.fade > 0) setTimeout(() => fadeOut(row), opt.fade * 1000);
  return row;
}

function fadeOut(row: HTMLElement) {
  if (!row.isConnected || row.classList.contains('out')) return;
  row.classList.add('out');
  setTimeout(() => row.remove(), 650);
}