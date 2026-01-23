import { VideoConfig } from './types';

export const VIDEO_CONFIG: VideoConfig = {
  // 视觉风格: 'default' | 'tech' | 'minimal'
  style: 'tech',

  // 动画风格: 'default' | 'smooth' | 'bouncy'
  motion: 'smooth',

  // 平台: 'horizontal' (1920x1080) | 'vertical' (1080x1920)
  platform: 'horizontal',

  // 帧率
  fps: 30,

  // 文案内容
  text: {
    title: 'Skill Router',
    subtitle: '给 AI Agent 装一个"技能目录"',
    painPoint: '装了 50 个 Skills\nAgent 却只会用 3 个？',
    solution: '让 Skills 自己"打招呼"\n让 Agent 自己"查表"',
    features: [
      '🔍 自动扫描已安装的 Skills',
      '📋 生成统一的路由表',
      '💾 两阶段加载省 Token',
      '🔒 Human-in-the-loop 安全阀',
    ],
    cta: 'skill-router init\n让你的 Agent 知道自己有什么能力',
  },
};
