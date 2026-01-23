import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { currentTheme, springConfig, layout } from '../DesignSystem';
import { VIDEO_CONFIG } from '../config';

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = VIDEO_CONFIG.text.solution.split('\n');

  // 连接线动画
  const lineProgress = spring({
    frame,
    fps,
    config: { ...springConfig, damping: 200 },
  });

  // 文字动画
  const textProgress = spring({
    frame,
    fps,
    delay: Math.floor(fps * 0.3),
    config: springConfig,
  });

  const line2Progress = spring({
    frame,
    fps,
    delay: Math.floor(fps * 1),
    config: springConfig,
  });

  // 路由图标动画
  const iconRotation = interpolate(frame, [0, fps * 3], [0, 360], {
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
      {/* 背景网格 */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundImage: `
            linear-gradient(${currentTheme.primaryColor}10 1px, transparent 1px),
            linear-gradient(90deg, ${currentTheme.primaryColor}10 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.5,
        }}
      />

      {/* 连接节点图示 */}
      <div
        style={{
          position: 'absolute',
          left: layout.margin,
          display: 'flex',
          flexDirection: 'column',
          gap: 80,
          opacity: interpolate(lineProgress, [0, 1], [0, 1]),
        }}
      >
        {['Skill A', 'Skill B', 'Skill C'].map((skill, i) => (
          <div
            key={skill}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              transform: `translateX(${interpolate(lineProgress, [0, 1], [-50, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: currentTheme.primaryColor,
                boxShadow: `0 0 20px ${currentTheme.primaryColor}80`,
              }}
            />
            <span
              style={{
                fontSize: layout.textSize,
                fontFamily: currentTheme.fontFamily,
                color: currentTheme.textColor,
                opacity: 0.7,
              }}
            >
              {skill}
            </span>
          </div>
        ))}
      </div>

      {/* 中央路由器图示 */}
      <div
        style={{
          width: 150,
          height: 150,
          borderRadius: layout.borderRadius,
          backgroundColor: currentTheme.primaryColor,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `rotate(${iconRotation}deg) scale(${lineProgress})`,
          boxShadow: `0 0 60px ${currentTheme.primaryColor}60`,
        }}
      >
        <span style={{ fontSize: 60 }}>🔀</span>
      </div>

      {/* 解决方案文字 */}
      <div
        style={{
          position: 'absolute',
          right: layout.margin,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 20,
        }}
      >
        {lines.map((line, index) => {
          const progress = index === 0 ? textProgress : line2Progress;
          return (
            <div
              key={index}
              style={{
                opacity: interpolate(progress, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(progress, [0, 1], [50, 0])}px)`,
              }}
            >
              <p
                style={{
                  fontSize: index === 0 ? layout.subtitleSize : layout.textSize,
                  fontFamily: currentTheme.fontFamily,
                  fontWeight: index === 0 ? 600 : 400,
                  color: index === 0 ? currentTheme.primaryColor : currentTheme.textColor,
                  margin: 0,
                  textAlign: 'right',
                }}
              >
                {line}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
