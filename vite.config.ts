import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { ensureBinaryUploadBackendServer } from './src/server/binary-upload-backend';

function binaryUploadBackendPlugin(): Plugin {
  return {
    name: 'binary-upload-backend',
    async configureServer(server) {
      const backend = await ensureBinaryUploadBackendServer();
      server.httpServer?.once('close', () => {
        void backend.close();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), binaryUploadBackendPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:43901',
        changeOrigin: false,
      },
    },
  },
});
