import type { Platform } from '../shared/icons';

export type { Platform };

export interface Emote {
  id?: string;
  name: string;
  url: string;
  zw: boolean;
}

export type Part = { t: 'text'; v: string } | ({ t: 'emote' } & Emote);

export interface Badge {
  url?: string;
  type?: string;
  title?: string;
}

export interface ChatMessage {
  platform: Platform;
  id?: string;
  uid?: string;
  login?: string;
  name: string;
  color: string;
  badges: Badge[];
  owner?: boolean;
  action?: boolean;
  raw: string;
  parts: Part[];
}