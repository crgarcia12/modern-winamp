import { defineConfig } from 'vite';

// Liliput proxy strips `/dev/.../liliput-task-920ccf05/` before requests
// reach this container. We must bake that prefix into asset URLs so the
// browser asks the right path; nginx then strips it for us.
export default defineConfig({
  base: '/dev/crgarcia12/modern-winamp/liliput-task-920ccf05/',
  server: {
    host: '0.0.0.0',
    port: 8080,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    chunkSizeWarningLimit: 4096,
  },
});
