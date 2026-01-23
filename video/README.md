# Skill Router 介绍视频

使用 [Remotion](https://remotion.dev/) 制作的 Skill Router 介绍视频。

## 视频结构

视频共 5 个场景，总时长约 20 秒：

1. **IntroScene (3s)** - 开场标题动画
2. **PainPointScene (4s)** - 展示痛点："装了 50 个 Skills，Agent 却只会用 3 个？"
3. **SolutionScene (4s)** - 展示解决方案：让 Skills 自己"打招呼"
4. **FeaturesScene (6s)** - 核心功能列表动画展示
5. **CTAScene (3s)** - 行动召唤：`skill-router init`

## 快速开始

```bash
# 安装依赖
npm install

# 启动 Remotion Studio 预览
npm start

# 渲染视频
npm run build
```

## 自定义

### 修改文案

编辑 `src/config.ts` 中的 `VIDEO_CONFIG.text` 对象。

### 修改视觉风格

在 `src/config.ts` 中修改：

- `style`: `'default'` | `'tech'` | `'minimal'`
- `motion`: `'default'` | `'smooth'` | `'bouncy'`
- `platform`: `'horizontal'` (1920x1080) | `'vertical'` (1080x1920)

### 修改场景时长

编辑 `src/DesignSystem.ts` 中的 `sceneDurations` 对象。

## 技术栈

- Remotion 4.x
- React 18
- TypeScript
- @remotion/transitions

## 项目结构

```
video/
├── src/
│   ├── config.ts          # 用户配置（文案、风格）
│   ├── types.ts           # 类型定义
│   ├── DesignSystem.ts    # 设计系统（颜色、动画、布局）
│   ├── Root.tsx           # Remotion 根组件
│   ├── SkillRouterIntro.tsx # 主视频组件
│   ├── index.ts           # 入口文件
│   └── scenes/            # 场景组件
│       ├── IntroScene.tsx
│       ├── PainPointScene.tsx
│       ├── SolutionScene.tsx
│       ├── FeaturesScene.tsx
│       └── CTAScene.tsx
├── package.json
├── tsconfig.json
└── remotion.config.ts
```

## 基于 remotion-best-practices skill 构建

本项目遵循 [remotion-best-practices](~/.agents/skills/remotion-best-practices) skill 的最佳实践：

- ✅ 使用 Configurable Architecture 分离内容/样式/动画
- ✅ 所有动画基于 `useCurrentFrame()` 驱动
- ✅ 使用 Spring 动画实现自然运动
- ✅ 使用 `<TransitionSeries>` 实现场景过渡
- ✅ 禁止使用 CSS 动画或 Tailwind 动画类
