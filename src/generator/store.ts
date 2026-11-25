import { computed, reactive, watch } from 'vue';
import { defaultSettings, hasChannel, settingsToQuery, type Settings } from '../shared/settings';

const STORE_KEY = 'lchat4u.settings';
const OLD_STORE_KEY = 'chat4u.settings';

function load(): Settings {
  const s = defaultSettings();
  try {
    const raw = localStorage.getItem(STORE_KEY) ?? localStorage.getItem(OLD_STORE_KEY) ?? '{}';
    const saved = JSON.parse(raw) as Partial<Settings>;
    const target = s as unknown as Record<string, unknown>;
    for (const k of Object.keys(s) as (keyof Settings)[]) {
      if (typeof saved[k] === typeof s[k]) target[k] = saved[k];
    }
  } catch { /* private mode or corrupted value: start from defaults */ }
  return s;
}

export const settings = reactive<Settings>(load());

watch(settings, () => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}, { deep: true });

function overlayBase(): URL {
  return new URL(location.protocol === 'file:' ? 'chat/index.html' : 'chat', location.href);
}

export const ready = computed(() => hasChannel(settings));

export const overlayQuery = computed(() => settingsToQuery(settings).toString().replace(/%2C/gi, ','));

export const overlayUrl = computed(() => {
  const url = overlayBase();
  url.search = overlayQuery.value;
  return url.toString();
});

export const previewReloadKey = computed(() => JSON.stringify([settings.stv, settings.bttv, settings.ffz]));

export const previewUrl = computed(() => {
  const url = overlayBase();
  const q = settingsToQuery({ ...settings, twitch: '', kick: '', kickroom: '', kickuid: '', yt: '', ytkey: '' });
  q.set('demo', '1');
  url.search = q.toString();
  return url.toString();
});