import { getJSON, svgURI, withRetry } from '../shared/util';
import { KICK_BADGE_SVG, KICK_GIFT_TIERS } from './kick-badges';
import type { Badge, Platform } from './types';

export const twitchBadges = new Map<string, string>(
  [
    ['broadcaster/1', '5527c58c-fb7d-422d-b71b-f309dcb85cc1'],
    ['moderator/1', '3267646d-33f0-4b17-b3df-f923a41db1d0'],
    ['vip/1', 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec'],
    ['partner/1', 'd12a2e27-16f6-41d0-ab77-b780518f00a3'],
  ].map(([k, id]) => [k, `https://static-cdn.jtvnw.net/badges/v1/${id}/2`]),
);

interface IvrBadgeSet { set_ID?: string; set_id?: string; setID?: string; versions?: { id: string; image_url_1x?: string; image_url_2x?: string }[] }

function ingest(list: IvrBadgeSet[]) {
  for (const s of list ?? []) {
    const set = s.set_ID ?? s.set_id ?? s.setID;
    for (const v of s.versions ?? []) {
      const url = v.image_url_2x ?? v.image_url_1x;
      if (set && url) twitchBadges.set(`${set}/${v.id}`, url);
    }
  }
}

export async function loadTwitchBadges(login: string) {
  try { ingest(await withRetry(() => getJSON('https://api.ivr.fi/v2/twitch/badges/global'))); } catch { /* fallbacks above */ }
  try { ingest(await withRetry(() => getJSON(`https://api.ivr.fi/v2/twitch/badges/channel?login=${encodeURIComponent(login)}`))); } catch { /* no sub badges */ }
}

export function twitchBadgeList(tag: string | undefined): Badge[] {
  const out: Badge[] = [];
  for (const b of (tag ?? '').split(',')) {
    const url = b && twitchBadges.get(b);
    if (url) out.push({ url, title: b });
  }
  return out;
}

const kickSubs: { months: number; src: string }[] = [];

export function setKickSubBadges(list: { months?: number; badge_image?: { src?: string; url?: string } }[]) {
  kickSubs.length = 0;
  for (const b of list ?? []) {
    const src = b.badge_image?.src ?? b.badge_image?.url;
    if (src) kickSubs.push({ months: b.months ?? 0, src });
  }
  kickSubs.sort((a, b) => a.months - b.months);
}

type KickBadgeV1 = { type: string; text?: string; count?: number; sort_order?: number };
type KickBadgeV2 = { name?: string; image_url?: string; metadata?: { level?: number }; sort_order?: number };

const KICK_ICON_FOR_TYPE: Record<string, string> = {
  broadcaster: 'HostBadge',
  moderator: 'ModeratorBadge',
  vip: 'VIPBadge',
  og: 'OGBadge',
  founder: 'FounderBadge',
  subscriber: 'SubscriberBadge',
  staff: 'StaffBadge',
  sidekick: 'SidekickBadge',
  verified: 'VerifiedBadge',
  bot: 'BotBadge'
};

const kickIconUrl = (name: string) => (KICK_BADGE_SVG[name] ? svgURI(KICK_BADGE_SVG[name]) : undefined);

function kickBadge(b: KickBadgeV1): Badge | null {
  if (b.type === 'subscriber' && kickSubs.length) {
    const months = b.count ?? 1;
    let best = kickSubs[0];
    for (const s of kickSubs) if (s.months <= months) best = s;
    return { url: best.src, title: b.text ?? 'Subscriber' };
  }
  if (b.type === 'sub_gifter') {
    const count = b.count ?? 1;
    let tier = KICK_GIFT_TIERS[0];
    for (const g of KICK_GIFT_TIERS) if (g <= count) tier = g;
    const url = kickIconUrl('Gift' + tier);
    return url ? { url, title: b.text ?? 'Sub Gifter' } : null;
  }
  const url = kickIconUrl(KICK_ICON_FOR_TYPE[b.type] ?? '');
  return url ? { url, title: b.text ?? b.type } : null;
}

/** Kick sends role badges (badges) plus image badges like the level badge (badges_v2), shown first. */
export function kickBadges(identity: { badges?: KickBadgeV1[]; badges_v2?: KickBadgeV2[] } | undefined): Badge[] {
  const out: Badge[] = [];
  const v2 = [...(identity?.badges_v2 ?? [])].sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0));
  for (const b of v2) if (b.image_url) out.push({ url: b.image_url, title: b.name === 'level' ? `Level ${b.metadata?.level ?? ''}` : b.name });
  const v1 = [...(identity?.badges ?? [])].sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0));
  for (const b of v1) {
    const badge = kickBadge(b);
    if (badge) out.push(badge);
  }
  return out;
}

/** demo only */
export const kickDemoBadge = (type: string, count = 3) => kickBadge({ type, count });

// YouTube's chat feed names the role but carries no image, so these icons stand in.
const icon = (body: string, bg?: string) =>
  svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${bg ? `<rect width="24" height="24" rx="5" fill="${bg}"/>` : ''}${body}</svg>`);

export const BADGE_ICON: Partial<Record<Platform, Record<string, string>>> = {
  youtube: {
    moderator: icon('<path fill="#5E84F1" d="M20.6 6.4 17.3 9.7l-2.6-.4-.4-2.6 3.3-3.3a5.6 5.6 0 0 0-7.4 7L3.5 17.1a2 2 0 1 0 2.9 2.9l6.7-6.7a5.6 5.6 0 0 0 7.5-6.9z"/>'),
    member: icon('<circle cx="12" cy="12" r="10" fill="#2BA640"/><path fill="#fff" d="m12 5.5 1.9 4 4.3.5-3.2 3 .9 4.3-3.9-2.2-3.9 2.2.9-4.3-3.2-3 4.3-.5z"/>'),
    verified: icon('<circle cx="12" cy="12" r="10" fill="#AAAAAA"/><path fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="m7.5 12.3 3 3 6-6.3"/>'),
  },
};