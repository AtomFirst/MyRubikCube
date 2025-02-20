module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended', // ESLint 推荐规则
    'plugin:vue/vue3-recommended', // Vue 3 推荐规则
    'plugin:prettier/recommended', // 启用 Prettier 插件
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // 自定义规则
    'vue/multi-word-component-names': 'off', // 允许单文件组件名
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto', // 自动处理换行符
      },
    ],
  },
};