<script setup lang="ts">
import { computed, ref } from 'vue';
import { PLATFORM_ICON } from '../../shared/icons';
import type { Align, Anim } from '../../shared/settings';
import { settings } from '../store';
import SegmentedControl from './SegmentedControl.vue';
import ToggleSwitch from './ToggleSwitch.vue';

const ANIM_OPTIONS: { value: Anim; label: string }[] = [
  { value: 'slide-left', label: 'Slide in · left' },
  { value: 'slide-right', label: 'Slide in · right' },
  { value: 'slide-up', label: 'Slide in · up' },
  { value: 'slide-down', label: 'Slide in · down' },
  { value: 'fade', label: 'Fade in' },
  { value: 'pop', label: 'Pop' },
  { value: 'none', label: 'None' }
];

const ALIGN_OPTIONS: { value: Align; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

const FONTS = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Nunito', 'Rubik', 'Open Sans', 'Lato', 'Oswald', 'Bebas Neue', 'Baloo 2', 'Fredoka', 'Comfortaa', 'Bangers', 'Press Start 2P', 'Lexend'];
const CUSTOM = '__custom';

const customFont = ref(!FONTS.includes(settings.font));
const fontChoice = computed({
  get: () => (customFont.value ? CUSTOM : settings.font),
  set: (v: string) => {
    customFont.value = v === CUSTOM;
    if (!customFont.value) settings.font = v;
  }
});

const off = (v: number, unit: string, zero = 'off') => (v ? v + unit : zero);

const PLATFORMS = [
  { platform: 'twitch', key: 'iconTwitch', label: 'Twitch' },
  { platform: 'kick', key: 'iconKick', label: 'Kick' },
  { platform: 'youtube', key: 'iconYoutube', label: 'YouTube' }
] as const;
</script>

<template>
  <section class="block">
    <h2>Appearance</h2>
    <div class="settings">
      <p class="subhead first">Text</p>
      <div class="set">
        <label for="font">Font</label>
        <select id="font" v-model="fontChoice">
          <option v-for="f in FONTS" :key="f" :value="f">{{ f }}</option>
          <option :value="CUSTOM">Other (Google Fonts)…</option>
        </select>
      </div>
      <div v-if="customFont" class="set">
        <label for="fontCustom">Google Font</label>
        <input id="fontCustom" v-model="settings.font" type="text" placeholder="Exact name, e.g. Lexend">
      </div>
      <div class="set">
        <label for="size">Size<span class="val">{{ settings.size }} px</span></label>
        <input id="size" v-model.number="settings.size" type="range" min="12" max="56" step="1">
      </div>
      <ToggleSwitch v-model="settings.caps" label="Caps" />
      <ToggleSwitch v-model="settings.fixcolors" label="Brighten dark names" />

      <p class="subhead">Outline</p>
      <div class="set">
        <label for="stroke">Stroke<span class="val">{{ off(settings.stroke, ' px') }}</span></label>
        <input id="stroke" v-model.number="settings.stroke" type="range" min="0" max="5" step="0.5">
      </div>
      <div class="set">
        <label for="shadow">Shadow<span class="val">{{ off(settings.shadow, '') }}</span></label>
        <input id="shadow" v-model.number="settings.shadow" type="range" min="0" max="5" step="1">
      </div>

      <p class="subhead">Layout &amp; motion</p>
      <div class="set">
        <span class="lbl">Align</span>
        <SegmentedControl v-model="settings.align" :options="ALIGN_OPTIONS" label="Text alignment" />
      </div>
      <div class="set">
        <label for="anim">Animation</label>
        <select id="anim" v-model="settings.anim">
          <option v-for="o in ANIM_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <div class="set">
        <label for="fade">Fade out<span class="val">{{ off(settings.fade, ' s', 'never') }}</span></label>
        <input id="fade" v-model.number="settings.fade" type="range" min="0" max="120" step="5">
      </div>
      <div class="set">
        <label for="topfade">Top fade<span class="val">{{ off(settings.topfade, '%') }}</span></label>
        <input id="topfade" v-model.number="settings.topfade" type="range" min="0" max="60" step="5">
      </div>
    </div>
  </section>

  <section class="block">
    <h2>Messages</h2>
    <div class="settings">
      <div class="set">
        <span id="plat-lbl">Show platform</span>
        <div class="seg multi" role="group" aria-labelledby="plat-lbl">
          <button
            v-for="o in PLATFORMS"
            :key="o.platform"
            type="button"
            :aria-pressed="settings[o.key]"
            :title="o.label"
            @click="settings[o.key] = !settings[o.key]"
          >
            <img :src="PLATFORM_ICON[o.platform]" alt="">
            {{ o.label }}
          </button>
        </div>
      </div>
      <ToggleSwitch v-model="settings.badges" label="Badges" />
      <ToggleSwitch v-model="settings.bots" label="Show bots" />
      <ToggleSwitch v-model="settings.hidecmd" label="Hide commands (!)" />
    </div>
  </section>

  <section class="block">
    <h2>Emotes</h2>
    <div class="settings">
      <ToggleSwitch v-model="settings.stv" label="7TV" />
      <ToggleSwitch v-model="settings.bttv" label="BetterTTV" />
      <ToggleSwitch v-model="settings.ffz" label="FrankerFaceZ" />
    </div>
    <p class="note">7TV and BetterTTV update live. FrankerFaceZ is checked every 2 minutes.</p>
  </section>
</template>