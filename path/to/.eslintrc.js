module.exports = {
  // ... your existing config
  overrides: [
    {
      files: ['src/queries/**/*.ts', 'src/queries/**/*.tsx'],
      rules: {
        // Disable problematic rules for this folder
        '@typescript-eslint/no-unnecessary-condition': 'off',
        // Add other rules that are causing problems
      },
    },
  ],
};
