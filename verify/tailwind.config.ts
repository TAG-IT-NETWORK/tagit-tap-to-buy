import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tagit: {
          bg: '#0a0a0a',
          accent: '#00ff9d',
          warn: '#ffcc00',
          danger: '#ff3b3b',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
