module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ["prettier",'@typescript-eslint'],
  extends: ["prettier", 'plugin:@typescript-eslint/recommended',"plugin:prettier/recommended"],
  "rules": {
    "prettier/prettier": "error"
  }
};
