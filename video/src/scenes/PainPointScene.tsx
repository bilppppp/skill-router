import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { currentTheme, springConfig, layout } from '../DesignSystem';
import { VIDEO_CONFIG } from '../config';

export const PainPointScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 文字逐行出现
  const lines = VIDEO_CONFIG.text.painPoint.split('\n');
  
  const line1Progress = spring({
    frame,
    fps,
    config: springConfig,
  });

  const line2Progress = spring({
    frame,
    fps,
    delay: Math.floor(fps * 0.8),
    config: springConfig,
  });

  // 问号动画
  const questionMarkScale = spring({
    frame,
    fps,
    delay: Math.floor(fps * 1.5),
    config: { ...springConfig, damping: 8, stiffness: 100 },
  });

  // 背景脉冲效果
  const pulseOpacity = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.3, 0.5]
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${currentTheme.gradientStart} 0%, ${currentTheme.gradientEnd} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* 背景警告圆 */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          border: `4px solid ${currentTheme.accentColor}`,
          opacity: pulseOpacity,
        }}
      />

      {/* 痛点文字 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {lines.map((line, index) => {
          const progress = index === 0 ? line1Progress : line2Progress;
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const y = interpolate(progress, [0, 1], [40, 0]);
          
          return (
            <div
              key={index}
              style={{
                opacity,
                transform: `translateY(${y}px)`,
              }}
            >
              <p
                style={{
                  fontSize: index === 0 ? layout.titleSize * 0.7 : layout.subtitleSize,
                  fontFamily: currentTheme.fontFamily,
                  fontWeight: index === 0 ? 700 : 400,
                  color: index === 0 ? currentTheme.accentColor : currentTheme.textColor,
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                {line}
              </p>
            </div>
          );
        })}
      </div>

      {/* 大问号 */}
      <div
        style={{
          position: 'absolute',
          right: layout.margin * 1.5,
          bottom: layout.margin * 1.5,
          transform: `scale(${questionMarkScale})`,
          opacity: interpolate(questionMarkScale, [0, 1], [0, 0.15]),
        }}
      >
        <span
          style={{
            fontSize: 400,
            fontFamily: currentTheme.fontFamily,
            fontWeight: 900,
            color: currentTheme.primaryColor,
          }}
        >
          ?
        </span>
      </div>
    </AbsoluteFill>
  );
};
