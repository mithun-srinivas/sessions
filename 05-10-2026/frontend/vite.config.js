import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // fixed port, because Express allows exactly this origin
    port: 5173,
    strictPort: true,
  },
});
