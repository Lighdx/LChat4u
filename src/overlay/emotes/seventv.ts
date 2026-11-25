import { getJSON, withRetry } from '../../shared/util';
import { keepAlive, type KeepAlive } from '../connection';
import { status } from '../status';
import type { Emote } from '../types';
import { emotes, replaceMap, reportCounts, type Scope } from './store';

interface StvEmote { id: string; name: string; flags?: number; data?: { flags?: number } | null }
interface StvChange { key: string; value?: StvEmote | null; old_value?: StvEmote | null }

const toEmote = (e: StvEmote): Emote => ({
  id: e.id,
  name: e.name,
  url: `https://cdn.7tv.app/emote/${e.id}/2x.webp`,
  zw: Boolean((e.flags ?? 0) & 1) || Boolean((e.data?.flags ?? 0) & 256)
});

export async function load7tvGlobal() {
  try {
    const r = await withRetry(() => getJSON<{ emotes?: StvEmote[] }>('https://7tv.io/v3/emote-sets/global'));
    replaceMap('global', '7tv', (r.emotes ?? []).map(toEmote));
  } catch { /* overlay keeps working without global emotes */ }
}

type ChannelScope = Exclude<Scope, 'global'>;
const state: Partial<Record<ChannelScope, { setId?: string; platform: string; uid: string }>> = {};

export async function load7tv(scope: ChannelScope, platform: 'twitch' | 'kick', uid: string) {
  let r: { emote_set?: { id: string; emotes?: StvEmote[] } | null; user?: { id: string } };
  try {
    r = await withRetry(() => getJSON(`https://7tv.io/v3/users/${platform}/${uid}`));
  } catch {
    status('7tv-' + scope, `7TV (${scope}): no account`);
    return;
  }
  const set = r.emote_set ?? undefined;
  replaceMap(scope, '7tv', (set?.emotes ?? []).map(toEmote));

  const old = state[scope];
  if (old?.setId && old.setId !== set?.id) {
    events.unsub('emote_set.update', old.setId);
    events.setScope.delete(old.setId);
  }
  if (set?.id) {
    events.setScope.set(set.id, scope);
    events.sub('emote_set.update', set.id);
  }
  if (r.user?.id) {
    events.userScope.set(r.user.id, scope);
    events.sub('user.update', r.user.id);
  }
  state[scope] = { setId: set?.id, platform, uid };
  status('7tv-' + scope, `7TV (${scope}): ${emotes[scope]['7tv'].size} emotes · live`);
}

/**
 * 7TV EventAPI. Emotes added, removed or renamed on 7TV show up in the next chat
 * message without refreshing the OBS source. user.update covers switching emote sets. :D
 */
class SevenTVEvents {
  private conn: KeepAlive | null = null;
  private opened = false;
  private subs = new Set<string>();
  private reloadTimers: Partial<Record<ChannelScope, number>> = {};
  setScope = new Map<string, ChannelScope>();
  userScope = new Map<string, ChannelScope>();

  sub(type: string, id: string) {
    const key = `${type}|${id}`;
    if (this.subs.has(key)) return;
    this.subs.add(key);
    if (!this.conn) this.connect();
    else this.send(35, type, id);
  }

  unsub(type: string, id: string) {
    if (this.subs.delete(`${type}|${id}`)) this.send(36, type, id);
  }

  private connect() {
    this.conn = keepAlive({
      url: () => 'wss://events.7tv.io/v3',
      pingAfter: 60_000,
      onOpen: () => {
        for (const key of this.subs) {
          const [type, id] = key.split('|');
          this.send(35, type, id);
        }
        if (this.opened) for (const [scope, st] of Object.entries(state)) if (st) load7tv(scope as ChannelScope, st.platform as 'twitch' | 'kick', st.uid);
        this.opened = true;
      },
      onMessage: (ws, data) => {
        let m: { op: number; d?: any };
        try { m = JSON.parse(data); } catch { return; }
        if (m.op === 0) this.dispatch(m.d);
        else if (m.op === 4 || m.op === 7) ws.close();
      }
    });
  }

  private send(op: number, type: string, id: string) {
    this.conn?.send(JSON.stringify({ op, d: { type, condition: { object_id: id } } }));
  }

  private dispatch(d: { type: string; body?: { id: string; pushed?: StvChange[]; pulled?: StvChange[]; updated?: StvChange[] } }) {
    const body = d?.body;
    if (!body) return;

    if (d.type === 'emote_set.update') {
      const scope = this.setScope.get(body.id);
      if (!scope) return;
      const map = emotes[scope]['7tv'];
      for (const c of body.pushed ?? []) if (c.key === 'emotes' && c.value) map.set(c.value.name, toEmote(c.value));
      for (const c of body.pulled ?? []) if (c.key === 'emotes' && c.old_value) map.delete(c.old_value.name);
      for (const c of body.updated ?? []) {
        if (c.key !== 'emotes') continue;
        if (c.old_value) map.delete(c.old_value.name);
        if (c.value) map.set(c.value.name, toEmote(c.value));
      }
      status('7tv-' + scope, `7TV (${scope}): ${map.size} emotes · live (updated)`);
      reportCounts();
    } else if (d.type === 'user.update') {
      const scope = this.userScope.get(body.id);
      const st = scope && state[scope];
      if (!scope || !st) return;
      clearTimeout(this.reloadTimers[scope]);
      this.reloadTimers[scope] = window.setTimeout(() => load7tv(scope, st.platform as 'twitch' | 'kick', st.uid), 1500);
    }
  }
}

const events = new SevenTVEvents();