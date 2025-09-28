// Flat ESLint config for Next.js 15+
// Reference: https://nextjs.org/docs/app/building-your-application/configuring/eslint
import next from 'eslint-config-next';

export default [
  // Spread Next.js recommended config (includes JS/TS/React rules)
  ...next,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
