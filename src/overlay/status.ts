import { opt } from './options';

const lines = new Map<string, string>();
const box = document.getElementById('status')!;

export function status(key: string, text: string) {
  lines.set(key, text);
  if (!opt.debug) return;
  box.hidden = false;
  box.textContent = [...lines.values()].join('\n');
}