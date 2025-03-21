import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get the PORT from environment variables or default to 5173
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5173;

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true, // Listen on all addresses
    port: PORT,
    strictPort: true // Fail if port is already in use
  },
  server: {
    host: true, // Listen on all addresses
    port: PORT,
    strictPort: true // Fail if port is already in use
  }
});
