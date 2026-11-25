import { getJSON } from '../../shared/util';
import { kickBadges, setKickSubBadges } from '../badges';
import { kickColor } from '../colors';
import { keepAlive } from '../connection';
import { load7tv } from '../emotes/seventv';
import { opt } from '../options';
import { addMessage, removeWhere } from '../render';
import { status } from '../status';
import type { Part } from '../types';

const KEYS = [opt.kickkey, '34bf7a0ff419a2a775b9'].filter(Boolean);
let keyIndex = 0;
const pusherURL = () =>
  `wss://ws-${opt.kickcluster}.pusher.com/app/${KEYS[keyIndex % KEYS.length]}?protocol=7&client=js&version=8.4.0&flash=false`;

function contentParts(content: string): Part[] {
  const parts: Part[] = [];
  const re = /\[emote:(\d+):([^\]]*)\]/g;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    if (m.index > i) parts.push({ t: 'text', v: content.slice(i, m.index) });
    parts.push({ t: 'emote', name: m[2], url: `https://files.kick.com/emotes/${m[1]}/fullsize`, zw: false });
    i = re.lastIndex;
  }
  if (i < content.length) parts.push({ t: 'text', v: content.slice(i) });
  return parts;
}

interface KickChannel {
  user_id?: number;
  chatroom?: { id: number };
  subscriber_badges?: { months?: number; badge_image?: { src?: string } }[];
}

interface KickChatEvent {
  id: string;
  content?: string;
  sender?: { id: number; username?: string; slug?: string; identity?: Parameters<typeof kickBadges>[0] & { color?: string } };
}

export async function startKick() {
  let room = opt.kickroom;
  let uid = opt.kickuid;

  if (opt.kick) {
    try {
      const ch = await getJSON<KickChannel>(`https://kick.com/api/v2/channels/${encodeURIComponent(opt.kick)}`);
      room ||= String(ch.chatroom?.id ?? '');
      uid ||= String(ch.user_id ?? '');
      setKickSubBadges(ch.subscriber_badges ?? []);
    } catch { /* use IDs from the URL */ }
  }

  if (uid && opt.stv) {
    load7tv('kick', 'kick', uid);
    setInterval(() => load7tv('kick', 'kick', uid), 600_000);
  }
  if (!room) {
    status('kick', 'Kick: missing chatroom ID (set it in the generator)');
    return;
  }

  const send = (ws: WebSocket, event: string, data: object) => ws.send(JSON.stringify({ event, data }));

  keepAlive({
    url: pusherURL,
    ping: (ws) => send(ws, 'pusher:ping', {}),
    onState: (s) => status('kick', s === 'connecting' ? 'Kick: connecting…' : 'Kick: reconnecting…'),
    onMessage: (ws, raw) => {
      let m: { event: string; data?: unknown };
      try { m = JSON.parse(raw); } catch { return; }
      let d: any = m.data;
      if (typeof d === 'string') {
        try { d = JSON.parse(d); } catch { /* keep string */ }
      }
      switch (m.event) {
        case 'pusher:connection_established':
          send(ws, 'pusher:subscribe', { auth: '', channel: `chatrooms.${room}.v2` });
          send(ws, 'pusher:subscribe', { auth: '', channel: `chatroom_${room}` });
          break;
        case 'pusher_internal:subscription_succeeded':
          status('kick', `Kick: connected to ${opt.kick || room}`);
          break;
        case 'pusher:error':
          if (d?.code === 4001) {
            keyIndex++; // next reconnect tries the other key
            status('kick', 'Kick: invalid Pusher key (use ?kickkey=)');
          }
          break;
        case 'pusher:ping':
          send(ws, 'pusher:pong', {});
          break;
        case 'App\\Events\\ChatMessageEvent': {
          const e = d as KickChatEvent;
          const s = e.sender ?? { id: 0 };
          addMessage({
            platform: 'kick',
            id: e.id,
            uid: String(s.id),
            login: s.slug ?? s.username,
            name: s.username ?? 'kick',
            color: kickColor(s.identity?.color),
            badges: kickBadges(s.identity),
            raw: e.content ?? '',
            parts: contentParts(e.content ?? '')
          });
          break;
        }
        case 'App\\Events\\MessageDeletedEvent':
          if (d?.message) removeWhere((x) => x.id === d.message.id);
          break;
        case 'App\\Events\\UserBannedEvent':
          if (d?.user) removeWhere((x) => x.p === 'kick' && x.uid === String(d.user.id));
          break;
        case 'App\\Events\\ChatroomClearEvent':
          removeWhere((x) => x.p === 'kick');
          break;
      }
    }
  });
}