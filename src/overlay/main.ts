import './overlay.css';
import { startDemo } from './demo';
import { loadBTTVGlobal } from './emotes/bttv';
import { loadFFZGlobal } from './emotes/ffz';
import { load7tvGlobal } from './emotes/seventv';
import { opt } from './options';
import { startKick } from './platforms/kick';
import { startTwitch } from './platforms/twitch';
import { startYouTube } from './platforms/youtube';
import { status } from './status';
import { applyStyle, listenForLiveSettings } from './style';

applyStyle();
if (opt.demo) listenForLiveSettings();

if (opt.stv) load7tvGlobal();
if (opt.bttv) loadBTTVGlobal();
if (opt.ffz) loadFFZGlobal();

if (opt.twitch) startTwitch();
if (opt.kick || opt.kickroom) startKick();
if (opt.yt) startYouTube();
if (opt.demo) startDemo();

if (!opt.twitch && !opt.kick && !opt.kickroom && !opt.yt && !opt.demo) {
  status('none', 'LChat4u: no channels in the URL');
}