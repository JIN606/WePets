import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import { reactComponentTagger } from 'react-component-tagger';

export default defineConfig({
  plugins: [react(), reactComponentTagger() as PluginOption, cloudflare()],
  build: {
    chunkSizeWarningLimit: 10240,
  },
});
