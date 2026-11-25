import type { Emote, Platform } from '../types';
import { status } from '../status';

type Provider = '7tv' | 'bttv' | 'ffz';
export type Scope = 'global' | 'twitch' | 'kick';
type ProviderMaps = Record<Provider, Map<string, Emote>>;

const PROVIDERS: Provider[] = ['7tv', 'bttv', 'ffz'];
const make = (): ProviderMaps => ({ '7tv': new Map(), bttv: new Map(), ffz: new Map() });

export const emotes: Record<Scope, ProviderMaps> = { global: make(), twitch: make(), kick: make() };

const LOOKUP: Record<Platform, Scope[]> = {
  twitch: ['twitch', 'global'],
  kick: ['kick', 'global'],
  youtube: ['twitch', 'kick', 'global']
};

export function findEmote(word: string, platform: Platform): Emote | undefined {
  for (const scope of LOOKUP[platform]) {
    for (const p of PROVIDERS) {
      const e = emotes[scope][p].get(word);
      if (e) return e;
    }
  }
  return undefined;
}

export function replaceMap(scope: Scope, provider: Provider, list: Iterable<Emote>) {
  const m = emotes[scope][provider];
  m.clear();
  for (const e of list) m.set(e.name, e);
  reportCounts();
}

export function allMaps(): Map<string, Emote>[] {
  const out: Map<string, Emote>[] = [];
  for (const s of Object.values(emotes)) for (const p of PROVIDERS) if (s[p].size) out.push(s[p]);
  return out;
}

export function reportCounts() {
  const n = (p: Provider) => emotes.global[p].size + emotes.twitch[p].size + emotes.kick[p].size;
  status('emotes', `Emotes  7TV ${n('7tv')} · BTTV ${n('bttv')} · FFZ ${n('ffz')}`);
}