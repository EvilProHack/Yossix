import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    angular({
      tsconfig: './tsconfig.app.json'
    }),
  ],
  resolve: {
    mainFields: ['module'],
  },
});
