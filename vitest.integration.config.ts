import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    setupFiles: ['tests/setup.ts'],
    globalSetup: ['tests/integration/globalSetup.ts'],
  },
});
