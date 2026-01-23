import { SpringConfig } from 'remotion';
import { VIDEO_CONFIG } from './config';

// --- 1. 视觉主题 ---

const THEMES = {
  default: {
    backgroundColor: '#ffffff',
    primaryColor: '#0b84f3',
    secondaryColor: '#666666',
    accentColor: '#ff6b35',
    textColor: '#1a1a1a',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    borderRadius: 12,
    gradientStart: '#f8f9fa',
    gradientEnd: '#e9ecef',
  },
  tech: {
    backgroundColor: '#0a0a0f',
    primaryColor: '#00d9ff',
    secondaryColor: '#7c3aed',
    accentColor: '#22c55e',
    textColor: '#ffffff',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    borderRadius: 8,
    gradientStart: '#0a0a0f',
    gradientEnd: '#1a1a2e',
  },
  minimal: {
    backgroundColor: '#fafafa',
    primaryColor: '#000000',
    secondaryColor: '#666666',
    accentColor: '#0066cc',
    textColor: '#1a1a1a',
    fontFamily: '"Inter", system-ui, sans-serif',
    borderRadius: 4,
    gradientStart: '#ffffff',
    gradientEnd: '#f5f5f5',
  },
};

export const currentTheme = THEMES[VIDEO_CONFIG.style];

// --- 2. 动画配置 ---

const MOTIONS: Record<string, Partial<SpringConfig>> = {
  default: {
    damping: 200,
    stiffness: 100,
    mass: 1,
  },
  smooth: {
    damping: 200,
    stiffness: 80,
    mass: 1,
  },
  bouncy: {
    damping: 12,
    stiffness: 100,
    mass: 1,
  },
};

export const springConfig: SpringConfig = {
  damping: 200,
  stiffness: 100,
  mass: 1,
  overshootClamping: false,
  ...MOTIONS[VIDEO_CONFIG.motion],
};

// --- 3. 平台/布局 ---

const PLATFORMS = {
  horizontal: {
    width: 1920,
    height: 1080,
    titleSize: 120,
    subtitleSize: 48,
    textSize: 36,
    codeSize: 32,
    margin: 120,
    itemSpacing: 60,
  },
  vertical: {
    width: 1080,
    height: 1920,
    titleSize: 80,
    subtitleSize: 36,
    textSize: 28,
    codeSize: 24,
    margin: 60,
    itemSpacing: 40,
  },
};

export const layout = PLATFORMS[VIDEO_CONFIG.platform];

// --- 4. 场景时长配置（以秒为单位）---

export const sceneDurations = {
  intro: 3,        // 开场标题
  painPoint: 4,    // 痛点展示
  solution: 4,     // 解决方案
  features: 6,     // 功能列表
  cta: 3,          // 行动召唤
  transition: 0.5, // 过渡时长
};

// 计算总帧数
export const getTotalDurationInFrames = (fps: number): number => {
  const totalSeconds = 
    sceneDurations.intro +
    sceneDurations.painPoint +
    sceneDurations.solution +
    sceneDurations.features +
    sceneDurations.cta;
  return Math.ceil(totalSeconds * fps);
};
