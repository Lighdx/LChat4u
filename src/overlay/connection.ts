/**
 * Keeps one WebSocket alive for the whole stream.
 *
 * - Reconnects when the socket closes, waiting 1s, 2s, 4s… up to 30s between tries.
 * - Detects "silent" dead sockets: when the network drops without a clean close, a socket can
 *   stay OPEN while receiving nothing. After `pingAfter` ms of silence it sends a ping; if
 *   nothing arrives within `timeout` ms more, it drops the socket and reconnects.
 * - Reconnects right away when the browser reports the network is back (`online` event).
 */
export interface KeepAliveOptions {
  url: () => string;
  onOpen?: (ws: WebSocket) => void;
  onMessage: (ws: WebSocket, data: string) => void;
  /** send an application-level ping; omit when the server sends its own heartbeats */
  ping?: (ws: WebSocket) => void;
  /** ms of silence before pinging (Infinity: no watchdog, for quiet sockets with no ping) */
  pingAfter?: number;
  timeout?: number;
  onState?: (state: 'connecting' | 'reconnecting') => void;
}

export interface KeepAlive {
  send(data: string): void;
  isOpen(): boolean;
}

export function keepAlive(o: KeepAliveOptions): KeepAlive {
  const pingAfter = o.pingAfter ?? 60_000;
  const timeout = o.timeout ?? 15_000;
  let ws: WebSocket | null = null;
  let attempt = 0;
  let lastSeen = Date.now();
  let pinged = false;
  let retryTimer = 0;

  function connect() {
    clearTimeout(retryTimer);
    o.onState?.('connecting');
    const sock = (ws = new WebSocket(o.url()));
    sock.onopen = () => {
      attempt = 0;
      lastSeen = Date.now();
      pinged = false;
      o.onOpen?.(sock);
    };
    sock.onmessage = (e) => {
      lastSeen = Date.now();
      pinged = false;
      o.onMessage(sock, String(e.data));
    };
    sock.onclose = () => {
      if (ws !== sock) return; // replaced on purpose
      ws = null;
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    o.onState?.('reconnecting');
    const delay = Math.min(30_000, 1000 * 2 ** attempt) * (0.8 + Math.random() * 0.4);
    attempt++;
    retryTimer = window.setTimeout(connect, delay);
  }

  function restart() {
    const old = ws;
    ws = null;
    if (old) {
      old.onclose = null;
      try { old.close(); } catch { /* already closing */ }
    }
    connect();
  }

  if (Number.isFinite(pingAfter)) {
    setInterval(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const idle = Date.now() - lastSeen;
      if (pinged && idle > pingAfter + timeout) restart();
      else if (!pinged && idle > pingAfter) {
        pinged = true;
        o.ping?.(ws);
      }
    }, 5000);
  }

  window.addEventListener('online', () => {
    // network is back: don't wait for the backoff or the watchdog
    if (!ws || ws.readyState !== WebSocket.OPEN || Date.now() - lastSeen > 10_000) restart();
  });

  connect();

  return {
    send(data) {
      if (ws?.readyState === WebSocket.OPEN) ws.send(data);
    },
    isOpen: () => ws?.readyState === WebSocket.OPEN
  };
}