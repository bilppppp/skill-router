import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { currentTheme, springConfig, layout } from '../DesignSystem';
import { VIDEO_CONFIG } from '../config';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 标题动画
  const titleScale = spring({
    frame,
    fps,
    config: springConfig,
  });

  const titleY = interpolate(titleScale, [0, 1], [50, 0]);

  // 副标题动画（延迟出现）
  const subtitleProgress = spring({
    frame,
    fps,
    delay: Math.floor(fps * 0.5),
    config: springConfig,
  });

  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [30, 0]);

  // 背景光效动画
  const glowOpacity = interpolate(frame, [0, fps * 2], [0, 0.6], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${currentTheme.gradientStart} 0%, ${currentTheme.gradientEnd} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentTheme.primaryColor}40 0%, transparent 70%)`,
          opacity: glowOpacity,
          filter: 'blur(80px)',
        }}
      />

      {/* 主标题 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `translateY(${titleY}px) scale(${titleScale})`,
        }}
      >
        <h1
          style={{
            fontSize: layout.titleSize,
            fontFamily: currentTheme.fontFamily,
            fontWeight: 800,
            color: currentTheme.primaryColor,
            margin: 0,
            letterSpacing: '-0.02em',
            textShadow: VIDEO_CONFIG.style === 'tech' 
              ? `0 0 40px ${currentTheme.primaryColor}80` 
              : 'none',
          }}
        >
          {VIDEO_CONFIG.text.title}
        </h1>
      </div>

      {/* 副标题 */}
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          marginTop: 30,
        }}
      >
        <p
          style={{
            fontSize: layout.subtitleSize,
            fontFamily: currentTheme.fontFamily,
            fontWeight: 400,
            color: currentTheme.textColor,
            margin: 0,
            opacity: 0.8,
          }}
        >
          {VIDEO_CONFIG.text.subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};
