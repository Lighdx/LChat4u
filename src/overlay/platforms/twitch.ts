import { loadTwitchBadges, twitchBadgeList } from '../badges';
import { twitchColor } from '../colors';
import { keepAlive } from '../connection';
import { loadBTTV } from '../emotes/bttv';
import { loadFFZ } from '../emotes/ffz';
import { load7tv } from '../emotes/seventv';
import { opt } from '../options';
import { addMessage, removeWhere } from '../render';
import { status } from '../status';
import type { Part } from '../types';

interface IrcMessage { tags: Record<string, string>; prefix: string; command: string; trailing: string | null }

const unescapeTag = (v: string) => v.replace(/\\(.)/g, (_, c: string) => (c === 's' ? ' ' : c === ':' ? ';' : c === 'n' || c === 'r' ? '' : c));

function parseIRC(line: string): IrcMessage {
  const msg: IrcMessage = { tags: {}, prefix: '', command: '', trailing: null };
  if (line[0] === '@') {
    const sp = line.indexOf(' ');
    for (const kv of line.slice(1, sp).split(';')) {
      const j = kv.indexOf('=');
      msg.tags[kv.slice(0, j)] = unescapeTag(kv.slice(j + 1));
    }
    line = line.slice(sp + 1);
  }
  if (line[0] === ':') {
    const sp = line.indexOf(' ');
    msg.prefix = line.slice(1, sp);
    line = line.slice(sp + 1);
  }
  const ti = line.indexOf(' :');
  if (ti >= 0) {
    msg.trailing = line.slice(ti + 2);
    line = line.slice(0, ti);
  }
  msg.command = line.split(' ')[0];
  return msg;
}

function nativeEmoteParts(text: string, tag: string | undefined): Part[] {
  if (!tag) return [{ t: 'text', v: text }];
  const cps = Array.from(text);
  const ranges: { a: number; b: number; id: string }[] = [];
  for (const group of tag.split('/')) {
    const [id, pos] = group.split(':');
    if (!pos) continue;
    for (const r of pos.split(',')) {
      const [a, b] = r.split('-').map(Number);
      ranges.push({ a, b, id });
    }
  }
  ranges.sort((x, y) => x.a - y.a);
  const parts: Part[] = [];
  let i = 0;
  for (const r of ranges) {
    if (r.a > i) parts.push({ t: 'text', v: cps.slice(i, r.a).join('') });
    parts.push({
      t: 'emote',
      name: cps.slice(r.a, r.b + 1).join(''),
      url: `https://static-cdn.jtvnw.net/emoticons/v2/${r.id}/default/dark/2.0`,
      zw: false
    });
    i = r.b + 1;
  }
  if (i < cps.length) parts.push({ t: 'text', v: cps.slice(i).join('') });
  return parts;
}

let roomLoaded = '';
function onRoom(roomId: string) {
  if (roomLoaded === roomId) return;
  roomLoaded = roomId;
  if (opt.stv) load7tv('twitch', 'twitch', roomId);
  if (opt.bttv) loadBTTV(roomId);
  if (opt.ffz) {
    loadFFZ(roomId);
    setInterval(() => loadFFZ(roomId), 120_000);
  }
  if (opt.stv) setInterval(() => load7tv('twitch', 'twitch', roomId), 600_000);
}

export function startTwitch() {
  const chan = opt.twitch;
  loadTwitchBadges(chan);

  const connect = () =>
    keepAlive({
      url: () => 'wss://irc-ws.chat.twitch.tv:443',
      ping: (ws) => ws.send('PING :lchat4u'),
      onState: (s) => status('twitch', s === 'connecting' ? 'Twitch: connecting…' : 'Twitch: reconnecting…'),
      onOpen: (ws) => {
        ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
        ws.send('PASS SCHMOOPIIE');
        ws.send('NICK justinfan' + (10000 + Math.floor(Math.random() * 89999)));
        ws.send('JOIN #' + chan);
      },
      onMessage: (ws, data) => {
        for (const line of data.split('\r\n')) {
          if (line) handle(ws, parseIRC(line));
        }
      }
    });

  const handle = (ws: WebSocket, m: IrcMessage) => {
    switch (m.command) {
      case 'PING':
        ws.send('PONG :' + (m.trailing ?? 'tmi.twitch.tv'));
        break;
      case 'RECONNECT':
        ws.close();
        break;
      case 'ROOMSTATE':
        if (m.tags['room-id']) {
          status('twitch', `Twitch: connected to #${chan}`);
          onRoom(m.tags['room-id']);
        }
        break;
      case 'CLEARCHAT': {
        const target = m.tags['target-user-id'];
        removeWhere((d) => d.p === 'twitch' && (!target || d.uid === target));
        break;
      }
      case 'CLEARMSG':
        removeWhere((d) => d.id === m.tags['target-msg-id']);
        break;
      case 'PRIVMSG': {
        let text = m.trailing ?? '';
        let action = false;
        if (text.startsWith('\u0001ACTION ')) {
          action = true;
          text = text.slice(8).replace(/\u0001$/, '');
        }
        const login = m.prefix.split('!')[0];
        addMessage({
          platform: 'twitch',
          id: m.tags.id,
          uid: m.tags['user-id'],
          login,
          name: m.tags['display-name'] || login,
          color: twitchColor(m.tags.color, login),
          badges: twitchBadgeList(m.tags.badges),
          action,
          raw: text,
          parts: nativeEmoteParts(text, m.tags.emotes)
        });
        break;
      }
    }
  };

  connect();
}