import { getJSON, HttpError, withRetry } from '../../shared/util';
import { keepAlive, type KeepAlive } from '../connection';
import type { Emote } from '../types';
import { emotes, replaceMap, reportCounts } from './store';

interface BttvEmote { id: string; code: string }

const ZERO_WIDTH = new Set(['SoSnowy', 'IceCold', 'SantaHat', 'TopHat', 'ReinDeer', 'CandyCane', 'cvMask', 'cvHazmat']);

const toEmote = (e: BttvEmote): Emote => ({
  id: e.id,
  name: e.code,
  url: `https://cdn.betterttv.net/emote/${e.id}/2x`,
  zw: ZERO_WIDTH.has(e.code)
});

export async function loadBTTVGlobal() {
  try {
    const list = await withRetry(() => getJSON<BttvEmote[]>('https://api.betterttv.net/3/cached/emotes/global'));
    replaceMap('global', 'bttv', list.map(toEmote));
  } catch { /* optional */ }
}

async function fetchChannel(twitchId: string) {
  try {
    const r = await withRetry(() =>
      getJSON<{ channelEmotes?: BttvEmote[]; sharedEmotes?: BttvEmote[] }>(`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`)
    );
    replaceMap('twitch', 'bttv', [...(r.channelEmotes ?? []), ...(r.sharedEmotes ?? [])].map(toEmote));
  } catch (e) {
    if (!(e instanceof HttpError)) throw e;
  }
}

export async function loadBTTV(twitchId: string) {
  await fetchChannel(twitchId);
  live.join(twitchId);
}

const live = {
  conn: null as KeepAlive | null,
  twitchId: '',
  opened: false,

  join(twitchId: string) {
    this.twitchId = twitchId;
    if (!this.conn) this.connect();
    else this.sendJoin();
  },

  sendJoin() {
    if (this.twitchId) this.conn?.send(JSON.stringify({ name: 'join_channel', data: { name: 'twitch:' + this.twitchId } }));
  },

  connect() {
    this.conn = keepAlive({
      url: () => 'wss://sockets.betterttv.net/ws',
      pingAfter: Infinity,
      onOpen: () => {
        this.sendJoin();
        if (this.opened && this.twitchId) fetchChannel(this.twitchId);
        this.opened = true;
      },
      onMessage: (_ws, data) => {
        let m: { name: string; data?: { emote?: BttvEmote; emoteId?: string } };
        try { m = JSON.parse(data); } catch { return; }
        const map = emotes.twitch.bttv;
        const d = m.data ?? {};
        const deleteById = (id?: string) => { for (const [k, v] of map) if (v.id === id) map.delete(k); };
        switch (m.name) {
          case 'emote_create': if (d.emote) map.set(d.emote.code, toEmote(d.emote)); break;
          case 'emote_delete': deleteById(d.emoteId); break;
          case 'emote_update': if (d.emote) { deleteById(d.emote.id); map.set(d.emote.code, toEmote(d.emote)); } break;
          default: return;
        }
        reportCounts();
      }
    });
  }
};