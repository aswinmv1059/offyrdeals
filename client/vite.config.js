import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/offyrdeals/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true
  }
});
