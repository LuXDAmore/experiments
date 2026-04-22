import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/experiment-01',
      'packages/experiment-02',
      'packages/experiment-03-hinatabokko',
      'packages/experiment-04-mono-no-aware',
    ],
  },
});
