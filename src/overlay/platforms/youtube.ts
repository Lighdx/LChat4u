import { getJSON, HttpError, sleep } from '../../shared/util';
import { YT_COLORS } from '../colors';
import { opt } from '../options';
import { addMessage, removeWhere } from '../render';
import { status } from '../status';
import type { Badge } from '../types';

// YouTube Data API v3. Needs an API key xd, so the free daily quota covers roughly 3-4 hours of chat.

type Target = { video: string } | { channel: string } | { handle: string };

function parseYouTubeInput(input: string): Target {
  const s = input.trim();
  const video =
    /[?&]v=([\w-]{11})/.exec(s) ?? /youtu\.be\/([\w-]{11})/.exec(s) ?? /\/(?:live|shorts|embed)\/([\w-]{11})/.exec(s);
  if (video) return { video: video[1] };
  const channel = /(UC[\w-]{22})/.exec(s);
  if (channel) return { channel: channel[1] };
  const handle = /@([\w.-]+)/.exec(s);
  if (handle) return { handle: '@' + handle[1] };
  if (/^[\w-]{11}$/.test(s)) return { video: s };
  return { handle: '@' + s.replace(/^@/, '') };
}

interface LiveChatItem {
  id: string;
  snippet?: {
    type?: string;
    displayMessage?: string;
    textMessageDetails?: { messageText?: string };
    messageDeletedDetails?: { deletedMessageId: string };
  };
  authorDetails?: {
    channelId?: string;
    displayName?: string;
    isChatOwner?: boolean;
    isChatModerator?: boolean;
    isChatSponsor?: boolean;
    isVerified?: boolean;
  };
}

export async function startYouTube() {
  if (!opt.ytkey) {
    status('yt', 'YouTube: missing API key');
    return;
  }
  const api = <T>(path: string, q: Record<string, string>) => getJSON<T>(`https://www.googleapis.com/youtube/v3/${path}?` + new URLSearchParams({ ...q, key: opt.ytkey }));
  const target = parseYouTubeInput(opt.yt);

  let channelId = 'channel' in target ? target.channel : '';
  if ('handle' in target) {
    try {
      const r = await api<{ items?: { id: string }[] }>('channels', { part: 'id', forHandle: target.handle });
      channelId = r.items?.[0]?.id ?? '';
    } catch { /* handled below */ }
    if (!channelId) {
      status('yt', 'YouTube: channel not found');
      return;
    }
  }

  async function findLiveChatId(): Promise<string> {
    for (;;) {
      try {
        let videoId = 'video' in target ? target.video : '';
        if (!videoId) {
          const r = await api<{ items?: { id: { videoId: string } }[] }>('search', {
            part: 'id', channelId, eventType: 'live', type: 'video', maxResults: '1',
          });
          videoId = r.items?.[0]?.id.videoId ?? '';
        }
        if (videoId) {
          const v = await api<{ items?: { liveStreamingDetails?: { activeLiveChatId?: string } }[] }>('videos', {
            part: 'liveStreamingDetails', id: videoId,
          });
          const chatId = v.items?.[0]?.liveStreamingDetails?.activeLiveChatId;
          if (chatId) return chatId;
        }
        status('yt', 'YouTube: not live, retrying…');
      } catch (e) {
        status('yt', `YouTube: error ${e instanceof HttpError ? e.status : ''} (API key or quota?)`);
      }
      // search costs 100 quota units, so channel lookups wait longer between tries
      await sleep('video' in target ? 60_000 : 300_000);
    }
  }

  for (;;) {
    const liveChatId = await findLiveChatId();
    status('yt', 'YouTube: connected');
    let pageToken = '';
    let first = true;
    for (;;) {
      let r: { items?: LiveChatItem[]; nextPageToken?: string; pollingIntervalMillis?: number };
      try {
        r = await api('liveChat/messages', {
          liveChatId, part: 'snippet,authorDetails', maxResults: '200', ...(pageToken ? { pageToken } : {}),
        });
      } catch {
        status('yt', 'YouTube: chat ended, looking again…');
        await sleep(60_000);
        break;
      }
      pageToken = r.nextPageToken ?? pageToken;
      let items = r.items ?? [];
      if (first) {
        items = items.slice(-5); // don't dump the whole backlog on connect
        first = false;
      }
      for (const it of items) handleItem(it);
      await sleep(Math.max(r.pollingIntervalMillis ?? 0, 6000));
    }
  }
}

function handleItem(it: LiveChatItem) {
  const sn = it.snippet ?? {};
  const a = it.authorDetails ?? {};
  if (sn.type === 'messageDeletedEvent' && sn.messageDeletedDetails) {
    const gone = sn.messageDeletedDetails.deletedMessageId;
    removeWhere((x) => x.id === gone);
    return;
  }
  const text = sn.displayMessage ?? sn.textMessageDetails?.messageText ?? '';
  if (!text) return;

  const badges: Badge[] = [];
  if (a.isChatModerator) badges.push({ type: 'moderator' });
  if (a.isChatSponsor) badges.push({ type: 'member' });
  if (a.isVerified) badges.push({ type: 'verified' });

  addMessage({
    platform: 'youtube',
    id: it.id,
    uid: a.channelId,
    login: a.displayName,
    name: (a.displayName ?? '').replace(/^@/, ''),
    color: a.isChatModerator ? YT_COLORS.moderator : a.isChatSponsor ? YT_COLORS.member : YT_COLORS.normal,
    owner: a.isChatOwner,
    badges,
    raw: text,
    parts: [{ t: 'text', v: text }]
  });
}