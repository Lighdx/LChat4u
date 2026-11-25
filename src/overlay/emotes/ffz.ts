import { getJSON, withRetry } from '../../shared/util';
import type { Emote } from '../types';
import { replaceMap } from './store';

// FFZ has no public live socket :C, so channel emotes are re-fetched on an interval (see platforms/twitch.ts).

type Urls = Record<string, string>;
interface FfzEmote { id: number; name: string; urls?: Urls; animated?: Urls | null }
interface FfzSets { sets?: Record<string, { emoticons?: FfzEmote[] }>; default_sets?: number[] }

function toEmote(e: FfzEmote): Emote {
  let url = e.animated?.['2'] ?? e.animated?.['1'] ?? e.urls?.['2'] ?? e.urls?.['1'] ?? '';
  if (url.startsWith('//')) url = 'https:' + url;
  return { id: String(e.id), name: e.name, url, zw: false };
}

function collect(r: FfzSets, ids: (string | number)[]): Emote[] {
  return ids.flatMap((id) => r.sets?.[id]?.emoticons ?? []).map(toEmote);
}

export async function loadFFZGlobal() {
  try {
    const r = await withRetry(() => getJSON<FfzSets>('https://api.frankerfacez.com/v1/set/global'));
    replaceMap('global', 'ffz', collect(r, r.default_sets ?? []));
  } catch { /* optional */ }
}

export async function loadFFZ(twitchId: string) {
  try {
    const r = await getJSON<FfzSets>(`https://api.frankerfacez.com/v1/room/id/${twitchId}`);
    replaceMap('twitch', 'ffz', collect(r, Object.keys(r.sets ?? {})));
  } catch { /* channel may have no FFZ room */ }
}