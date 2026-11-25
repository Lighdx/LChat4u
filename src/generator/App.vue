<script setup lang="ts">
import ChannelCard from './components/ChannelCard.vue';
import OptionsCard from './components/OptionsCard.vue';
import PreviewPane from './components/PreviewPane.vue';
import UrlCard from './components/UrlCard.vue';
</script>

<template>
  <main class="page">
    <header>
      <div class="head">
        <h1>LChat4u</h1>
        <p class="kicker">Setup</p>
      </div>
      <p class="intro">
        Show your <b>Twitch</b>, <b>Kick</b> and <b>YouTube</b> chat in a single OBS source, with
        <b>7TV</b>, <b>BetterTTV</b> and <b>FrankerFaceZ</b> emotes. New 7TV and BetterTTV emotes show up on their own,
        no source refresh needed.
      </p>
    </header>

    <div class="panel">
      <ChannelCard />
      <div class="split">
        <div class="col">
          <OptionsCard />
        </div>
        <div class="col col-side">
          <div class="sticky">
            <PreviewPane />
            <UrlCard />
          </div>
        </div>
      </div>
    </div>

    <footer class="foot">
      <p>LChat4u is and will always be free. If it helps you, you can buy me a coffee.</p>
      <nav class="links" aria-label="Project links">
        <a class="kofi" href="https://ko-fi.com/lighdx" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M3 6h14v7a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6zm14 1.5h1.5a3 3 0 0 1 0 6H17v-2h1.5a1 1 0 0 0 0-2H17zM10 15.6l-2.6-2.5a1.6 1.6 0 0 1 2.3-2.3l.3.3.3-.3a1.6 1.6 0 0 1 2.3 2.3z" /></svg>
          Support me on Ko-fi
        </a>
        <a href="https://github.com/Lighdx/LChat4u" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5a10.5 10.5 0 0 0-3.3 20.5c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.4-3.5-1.4-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.5 1.1 3.1.9.1-.7.4-1.1.7-1.4-2.3-.3-4.8-1.2-4.8-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1a10 10 0 0 1 5.2 0c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.8 0 4-2.5 4.9-4.8 5.2.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10.5 10.5 0 0 0 12 1.5z" /></svg>
          GitHub
        </a>
      </nav>
      <p class="legal">
        LChat4u is an independent project and is not affiliated with, sponsored or endorsed by Twitch, Kick, YouTube,
        7TV, BetterTTV or FrankerFaceZ.
      </p>
    </footer>
  </main>
</template>