import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative assets work locally and when deployed under GitHub Pages /BintangToba/.
  base: './',
  plugins: [react()],
  server: {
    // Allow Arena's proxied preview host without restricting local development.
    allowedHosts: ['.e2b.app'],
  },
});
