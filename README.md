# LChat4u

**https://lchat4u.lighdx.live**

Twitch, Kick and YouTube chat in one OBS browser source, with 7TV, BetterTTV and FrankerFaceZ emotes.
7TV and BTTV emote changes appear live, without refreshing the source.

Not affiliated with Twitch, Kick, YouTube, 7TV, BetterTTV or FrankerFaceZ.

## Setup

Needs Node.js 24 and [pnpm](https://pnpm.io).

```
pnpm install
pnpm dev            # http://localhost:5177  (overlay at /chat)
```

## Build

```
pnpm build
```

Writes two self-contained HTML files to `dist/`:

- `dist/index.html` – the generator. Type your channels, copy the URL.
- `dist/chat/index.html` – the overlay. Hosted, it's served at `/chat?twitch=…`.

In OBS: Sources → + → Browser, uncheck "Local file", paste the URL.

## Project layout

```
index.html              generator page (entry)
chat/index.html         overlay page (entry)
public/                 share preview image (og.png), robots.txt, sitemap.xml, CNAME (copied as-is)
build.mjs               production build: one inlined HTML per page
vite.config.ts          dev server (+ /chat route)
src/
  shared/
    settings.ts         every URL option + defaults, used by both pages
    icons.ts, util.ts
  generator/            URL builder, Vue 3
    App.vue             page layout, header and footer
    store.ts            settings state + the URLs it produces
    components/         ChannelCard, OptionsCard, PreviewPane, UrlCard + two small controls
  overlay/              the OBS chat, plain TypeScript (no framework at runtime)
    main.ts, render.ts, options.ts, colors.ts, badges.ts, demo.ts, style.ts, connection.ts
    kick-badges.ts      Kick's badge artwork (Kick's chat feed sends only the badge type)
    platforms/          twitch.ts (IRC), kick.ts (Pusher), youtube.ts (Data API)
    emotes/             seventv.ts (live), bttv.ts (live), ffz.ts (polled), store.ts
```

## Overlay URL parameters

The generator writes these; you rarely need them by hand.

| Param | Meaning |
| --- | --- |
| `twitch`, `kick`, `yt` | channels (YouTube: @handle, channel ID or live link) |
| `kickroom`, `kickuid` | Kick chatroom / user ID (filled in by the generator) |
| `ytkey` | YouTube Data API key |
| `platform` | icons to show: omitted = all, `0` = none, or a list like `twitch,kick` |
| `badges`, `bots`, `hidecmd`, `caps`, `fixcolors` | `1` / `0` |
| `shadow` | intensity `0`-`5` (default `2`, `0` = off) |
| `7tv`, `bttv`, `ffz` | emote providers, `1` / `0` |
| `anim` | `slide-left`, `slide-right`, `slide-up`, `slide-down`, `fade`, `pop`, `none` |
| `align` | `left`, `center`, `right` |
| `size`, `stroke`, `fade` | px, px, seconds (0 = never) |
| `topfade` | % of the height that fades out at the top (0 = off) |
| `font` | any Google Fonts family (or a font installed on the PC) |
| `weight` | message text weight `400`-`800` (default `400`; names are always `800`) |
| `kickkey`, `kickcluster` | override Kick's Pusher key if Kick rotates it |
| `botnames` | extra bot names to hide, comma-separated |
| `debug` | show the connection status box |

## License

Free to use, modify and share, including on monetized streams. You may not sell it or charge
for it (or for hosting/services built mainly on it). See [LICENSE](LICENSE): MIT with the
Commons Clause condition.