import { settingsFromQuery } from '../shared/settings';

const P = new URLSearchParams(location.search);
const flag = (k: string, def: boolean) => (P.has(k) ? P.get(k) !== '0' : def);

export const opt = {
  ...settingsFromQuery(P),

  kickkey: (P.get('kickkey') ?? '').trim(),
  kickcluster: (P.get('kickcluster') ?? '').trim() || 'us2',
  botnames: (P.get('botnames') ?? '').trim(),
  max: Number(P.get('max')) || 60,
  demo: flag('demo', false),
  debug: flag('debug', false)
};