import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // Project pages are served from /<repo>/, while the dev server stays at /.
  base: command === 'build' ? '/calculator/' : '/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/calculator.js', 'src/format.js', 'src/keyboard.js'],
      reporter: ['text', 'html'],
    },
  },
}));
