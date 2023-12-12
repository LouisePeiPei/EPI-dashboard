import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/EPI-dashboard/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        dir: 'dist',
      },
    },
    assets: {
      // Adjust the path to match the location of your CSV file within the 'data' folder
      include: ['data/per-capita-emissions.csv'],
      // Modify the destination path if needed
      // This will place the copied file in the 'data' folder within the build output
      base: '/EPI-dashboard/data',
    },
  },
});

