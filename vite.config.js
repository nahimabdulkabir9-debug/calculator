import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/calculator.js', 'src/format.js', 'src/keyboard.js'],
      reporter: ['text', 'html'],
    },
  },
});
