<script setup lang="ts">
import { computed, ref } from 'vue';
import { overlayUrl, ready, settings } from '../store';

const copied = ref(false);
const showKeyWarning = computed(() => Boolean(settings.yt.trim() && settings.ytkey.trim()));

async function copy() {
  try {
    await navigator.clipboard.writeText(overlayUrl.value);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = overlayUrl.value;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
  <section class="block">
    <h2>OBS URL</h2>
    <output id="obs-url" aria-label="OBS URL" :class="{ empty: !ready }">
      {{ ready ? overlayUrl : 'Enter at least one channel and your URL shows up here.' }}
    </output>
    <div class="btns">
      <button class="btn primary" type="button" :disabled="!ready" @click="copy">
        {{ copied ? 'Copied ✓' : 'Copy URL' }}
      </button>
      <a v-if="ready" class="btn ghost" :href="overlayUrl" target="_blank" rel="noopener">Open</a>
    </div>
    <p v-if="showKeyWarning" class="warn">This URL contains your YouTube API key. Don't show it on stream.</p>
    <ol class="howto">
      <li>In OBS: <b>Sources → + → Browser</b>.</li>
      <li>Uncheck <b>Local file</b> and paste the URL.</li>
      <li>Width <b>400</b>, height <b>700</b> (or whatever fits).</li>
    </ol>
  </section>
</template>