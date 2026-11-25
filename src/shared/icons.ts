import { svgURI } from './util';

export type Platform = 'twitch' | 'kick' | 'youtube';

export const PLATFORM_ICON: Record<Platform, string> = {
  twitch: svgURI(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#9146FF" d="M4.3 1 1.5 4.6v15.2h4.8V23h3l3.2-3.2h3.9L22.5 13V1zm16.3 11.1-3.2 3.2h-4.8l-3.2 3.2v-3.2H5.5V2.9h15.1z"/><path fill="#9146FF" d="M16.6 6.3h2v5.4h-2zm-5.2 0h2v5.4h-2z"/></svg>',
  ),
  kick: svgURI(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#53FC18"/><path fill="#000" d="M5.5 4.5h4.5v3.8h1.6V6.4h1.7V4.5h4.5v5.7h-1.8v1.6h-1.8v.6h1.8v1.6h1.8v5.5h-4.5V18h-1.7v-1.9H10v3.4H5.5z"/></svg>',
  ),
  youtube: svgURI(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="5" fill="#FF0000"/><path fill="#fff" d="M10 8.3v7.4l6.2-3.7z"/></svg>',
  ),
};