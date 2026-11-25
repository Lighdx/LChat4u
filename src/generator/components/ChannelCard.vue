<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { PLATFORM_ICON } from '../../shared/icons';
import { cleanChannel } from '../../shared/settings';
import { settings } from '../store';

const kickSlug = computed(() => cleanChannel(settings.kick));
const kickIdsKnown = computed(() => Boolean(settings.kickroom.trim() && settings.kickuid.trim()));
const kickApiUrl = computed(() => `https://kick.com/api/v2/channels/${encodeURIComponent(kickSlug.value)}`);
type KickState = 'loading' | 'ok' | 'manual';
const kickState = ref<KickState>('loading');
const showManual = ref(false);

let lastSlug = '';
let timer = 0;

function applyKick(room?: unknown, uid?: unknown) {
  if (room) settings.kickroom = String(room);
  if (uid) settings.kickuid = String(uid);
  if (room) {
    kickState.value = 'ok';
    showManual.value = false;
  }
}

async function lookupKick() {
  const slug = kickSlug.value;
  if (!slug) return;
  lastSlug = slug;
  if (kickIdsKnown.value) {
    kickState.value = 'ok';
    return;
  }
  kickState.value = 'loading';
  try {
    const res = await fetch(kickApiUrl.value);
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    if (slug !== kickSlug.value) return;
    if (!j?.chatroom?.id) throw new Error('no chatroom');
    applyKick(j.chatroom.id, j.user_id);
  } catch {
    if (slug !== kickSlug.value) return;
    kickState.value = 'manual';
    showManual.value = true;
  }
}

watch(kickSlug, (slug) => {
  if (slug !== lastSlug) {
    settings.kickroom = '';
    settings.kickuid = '';
  }
  clearTimeout(timer);
  timer = window.setTimeout(lookupKick, 700);
});

onMounted(() => {
  lastSlug = kickSlug.value;
  if (kickSlug.value) lookupKick();
});

function onPaste(e: Event) {
  const text = (e.target as HTMLTextAreaElement).value;
  try {
    const j = JSON.parse(text);
    applyKick(j?.chatroom?.id, j?.user_id);
    return;
  } catch { /* not clean JSON: fall back to regex */ }
  const room = /"chatroom"\s*:\s*\{[^{}]*?"id"\s*:\s*(\d+)/.exec(text);
  const uid = /"user_id"\s*:\s*(\d+)/.exec(text);
  applyKick(room?.[1], uid?.[1]);
}

const kickLabel: Record<KickState, string> = {
  loading: 'Looking up IDs…',
  ok: 'IDs found ✓',
  manual: 'Paste the IDs manually'
};
</script>

<template>
  <section class="block channels">
    <h2>Enter channel name</h2>

    <label class="field">
      <img :src="PLATFORM_ICON.twitch" alt="">
      <input v-model="settings.twitch" placeholder="Twitch channel" autocomplete="off" spellcheck="false" aria-label="Twitch channel">
    </label>

    <label class="field">
      <img :src="PLATFORM_ICON.kick" alt="">
      <input v-model="settings.kick" placeholder="Kick channel" autocomplete="off" spellcheck="false" aria-label="Kick channel">
    </label>
    <div v-if="kickSlug" class="sub">
      <div class="row">
        <span class="tag" :class="{ ok: kickState === 'ok', warn: kickState === 'manual' }">{{ kickLabel[kickState] }}</span>
      </div>
      <div v-if="showManual">
        Kick blocked the automatic lookup. Open
        <a :href="kickApiUrl" target="_blank" rel="noopener">this page</a>, copy all of its text and paste it here:
        <textarea placeholder="Paste the Kick page text here" aria-label="Kick page text" @input="onPaste" />
      </div>
      <div class="row pair">
        <label class="field"><input v-model="settings.kickroom" placeholder="Chatroom ID" inputmode="numeric" aria-label="Chatroom ID"></label>
        <label class="field"><input v-model="settings.kickuid" placeholder="User ID (for 7TV)" inputmode="numeric" aria-label="User ID"></label>
      </div>
    </div>

    <label class="field">
      <img :src="PLATFORM_ICON.youtube" alt="">
      <input v-model="settings.yt" placeholder="YouTube: @handle, UC… channel ID or stream link" autocomplete="off" spellcheck="false" aria-label="YouTube channel or stream">
    </label>
    <div v-if="settings.yt.trim()" class="sub">
      YouTube needs a free API key from
      <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener">Google Cloud (YouTube Data API v3)</a>.
      The daily quota covers about 3–4 hours of chat; a stream link uses less of it than an @handle.
      <label class="field">
        <input v-model="settings.ytkey" placeholder="YouTube API key" autocomplete="off" spellcheck="false" aria-label="YouTube API key">
      </label>
    </div>
  </section>
</template>