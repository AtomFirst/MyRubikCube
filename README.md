# 魔方模拟器

- 可以输入公式并查看魔方的状态序列
- 已部署在 [我的主页](https://atomfirst.github.io/rubik-cube/index.html)

## 目录结构

```bash
src/
├── ...
├── components
│   ├── Cube32D.vue # 单个魔方的显示
│   ├── Cube3List2D.vue # 魔方状态序列的显示
│   └── RubikCube.vue # 交互界面
└── rubik-cube
    └── rubik-cube.ts # 魔方转动逻辑
```

## 本地调试

```bash
pnpm install
pnpm run dev
```
