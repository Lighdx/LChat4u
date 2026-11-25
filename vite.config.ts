import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';

function cleanChatUrl(): Plugin {
  return {
    name: 'lchat4u-clean-chat-url',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/chat(?:\?|$)/.test(req.url)) req.url = req.url.replace(/^\/chat/, '/chat/index.html');
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [vue(), cleanChatUrl()],
  server: { port: 5177 }
});