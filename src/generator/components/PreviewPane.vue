<script setup lang="ts">
import { ref, watch } from 'vue';
import { overlayQuery, previewReloadKey, previewUrl } from '../store';
import SegmentedControl from './SegmentedControl.vue';

type Backdrop = 'dark' | 'light' | 'check';
const BACKDROPS: { value: Backdrop; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'check', label: 'Transparent' }
];
const BG_KEY = 'lchat4u.previewBg';
const OLD_BG_KEY = 'chat4u.previewBg';

function savedBackdrop(): Backdrop {
  try {
    const v = localStorage.getItem(BG_KEY) ?? localStorage.getItem(OLD_BG_KEY);
    if (v === 'dark' || v === 'light' || v === 'check') return v;
  } catch { /* ignore */ }
  return 'dark';
}
const backdrop = ref<Backdrop>(savedBackdrop());
watch(backdrop, (v) => {
  try { localStorage.setItem(BG_KEY, v); } catch { /* ignore */ }
});

const frame = ref<HTMLIFrameElement>();
const src = ref(previewUrl.value);

type Speed = 'off' | 'slow' | 'normal' | 'fast' | 'hype';
const SPEEDS: { value: Speed; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
  { value: 'hype', label: 'Hype' }
];
const RATE: Record<Speed, number> = { off: 0, slow: 0.3, normal: 0.6, fast: 3, hype: 12 };
const SPEED_KEY = 'lchat4u.previewSpeed';

function savedSpeed(): Speed {
  try {
    const v = localStorage.getItem(SPEED_KEY);
    if (v && v in RATE) return v as Speed;
  } catch { /* ignore */ }
  return 'normal';
}
const speed = ref<Speed>(savedSpeed());

function post(message: object) {
  const target = location.origin === 'null' ? '*' : location.origin;
  frame.value?.contentWindow?.postMessage(message, target);
}

const pushSettings = () => post({ type: 'lchat4u:settings', query: overlayQuery.value });
const pushSpeed = () => post({ type: 'lchat4u:demo-rate', rate: RATE[speed.value] });
function onFrameLoad() {
  pushSettings();
  pushSpeed();
}
watch(overlayQuery, pushSettings);
watch(speed, (v) => {
  pushSpeed();
  try { localStorage.setItem(SPEED_KEY, v); } catch { /* ignore */ }
});

let timer = 0;
watch(previewReloadKey, () => {
  clearTimeout(timer);
  timer = window.setTimeout(() => (src.value = previewUrl.value), 500);
});
</script>

<template>
  <section class="block">
    <div class="pvhead">
      <h2>Preview</h2>
      <SegmentedControl v-model="backdrop" :options="BACKDROPS" label="Preview background" />
    </div>
    <div class="preview" :class="backdrop !== 'dark' && `bg-${backdrop}`">
      <iframe ref="frame" :src="src" title="Chat preview" @load="onFrameLoad" />
    </div>
    <div class="pvspeed">
      <span id="speed-lbl">Chat speed</span>
      <SegmentedControl v-model="speed" :options="SPEEDS" label="Sample chat speed" />
      <span class="val">{{ RATE[speed] ? `~${RATE[speed] < 1 ? Math.round(RATE[speed] * 60) + '/min' : RATE[speed] + '/s'}` : 'samples paused' }}</span>
    </div>
    <p class="pvnote">
      Sample messages to try out the look. They never show up in OBS.
    </p>
  </section>
</template>