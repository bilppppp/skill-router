// 视频配置类型定义

export type ThemeType = 'default' | 'tech' | 'minimal';
export type MotionType = 'default' | 'smooth' | 'bouncy';
export type PlatformType = 'horizontal' | 'vertical';

export interface VideoConfig {
  style: ThemeType;
  motion: MotionType;
  platform: PlatformType;
  fps: number;
  text: {
    title: string;
    subtitle: string;
    painPoint: string;
    solution: string;
    features: string[];
    cta: string;
  };
}

export interface SceneProps {
  title?: string;
  subtitle?: string;
  content?: string;
  items?: string[];
}
