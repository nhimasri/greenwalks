import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended'],
  {
    files: ['firestore.rules', 'DRAFT_firestore.rules'],
    rules: {
      // You can add custom rule overrides here if needed
    }
  }
];
