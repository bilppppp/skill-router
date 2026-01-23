import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { currentTheme, springConfig, layout } from '../DesignSystem';
import { VIDEO_CONFIG } from '../config';

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = VIDEO_CONFIG.text.features;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${currentTheme.gradientStart} 0%, ${currentTheme.gradientEnd} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        padding: layout.margin,
        overflow: 'hidden',
      }}
    >
      {/* 标题 */}
      <div
        style={{
          position: 'absolute',
          top: layout.margin,
          left: layout.margin,
        }}
      >
        <h2
          style={{
            fontSize: layout.subtitleSize,
            fontFamily: currentTheme.fontFamily,
            fontWeight: 600,
            color: currentTheme.primaryColor,
            margin: 0,
            opacity: interpolate(
              spring({ frame, fps, config: springConfig }),
              [0, 1],
              [0, 1]
            ),
          }}
        >
          核心功能
        </h2>
      </div>

      {/* 功能列表 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: layout.itemSpacing,
          maxWidth: 1200,
        }}
      >
        {features.map((feature, index) => {
          const delay = Math.floor(fps * (0.3 + index * 0.4));
          const progress = spring({
            frame,
            fps,
            delay,
            config: springConfig,
          });

          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const x = interpolate(progress, [0, 1], [-100, 0]);
          const scale = interpolate(progress, [0, 1], [0.8, 1]);

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                opacity,
                transform: `translateX(${x}px) scale(${scale})`,
                backgroundColor: `${currentTheme.primaryColor}10`,
                padding: '30px 50px',
                borderRadius: layout.borderRadius,
                borderLeft: `4px solid ${currentTheme.primaryColor}`,
              }}
            >
              <span
                style={{
                  fontSize: layout.textSize * 1.2,
                  fontFamily: currentTheme.fontFamily,
                  fontWeight: 500,
                  color: currentTheme.textColor,
                }}
              >
                {feature}
              </span>
            </div>
          );
        })}
      </div>

      {/* 装饰元素 */}
      <div
        style={{
          position: 'absolute',
          right: -100,
          bottom: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentTheme.secondaryColor}20 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
    </AbsoluteFill>
  );
};
