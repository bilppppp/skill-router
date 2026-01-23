import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { currentTheme, springConfig, layout } from '../DesignSystem';
import { VIDEO_CONFIG } from '../config';

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = VIDEO_CONFIG.text.cta.split('\n');

  // 代码框动画
  const codeProgress = spring({
    frame,
    fps,
    config: springConfig,
  });

  // 文字动画
  const textProgress = spring({
    frame,
    fps,
    delay: Math.floor(fps * 0.5),
    config: springConfig,
  });

  // 光标闪烁
  const cursorOpacity = Math.sin(frame * 0.3) > 0 ? 1 : 0;

  // 打字机效果
  const command = lines[0];
  const typedLength = Math.min(
    Math.floor(interpolate(frame, [fps * 0.3, fps * 1.5], [0, command.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })),
    command.length
  );
  const typedCommand = command.slice(0, typedLength);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${currentTheme.gradientStart} 0%, ${currentTheme.gradientEnd} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* 背景光效 */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 50% 50%, ${currentTheme.primaryColor}15 0%, transparent 60%)`,
        }}
      />

      {/* 代码框 */}
      <div
        style={{
          transform: `scale(${codeProgress})`,
          opacity: interpolate(codeProgress, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            backgroundColor: VIDEO_CONFIG.style === 'tech' ? '#1a1a2e' : '#2d2d2d',
            borderRadius: layout.borderRadius,
            padding: '40px 60px',
            boxShadow: `0 20px 60px ${currentTheme.primaryColor}30`,
            border: `1px solid ${currentTheme.primaryColor}30`,
          }}
        >
          {/* 终端头部 */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27ca40' }} />
          </div>

          {/* 命令行 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontSize: layout.codeSize,
                fontFamily: '"SF Mono", "Fira Code", monospace',
                color: currentTheme.accentColor,
              }}
            >
              ${' '}
            </span>
            <span
              style={{
                fontSize: layout.codeSize,
                fontFamily: '"SF Mono", "Fira Code", monospace',
                color: '#ffffff',
              }}
            >
              {typedCommand}
            </span>
            <span
              style={{
                width: 3,
                height: layout.codeSize,
                backgroundColor: currentTheme.primaryColor,
                marginLeft: 2,
                opacity: cursorOpacity,
              }}
            />
          </div>
        </div>
      </div>

      {/* 说明文字 */}
      <div
        style={{
          marginTop: 60,
          opacity: interpolate(textProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(textProgress, [0, 1], [30, 0])}px)`,
        }}
      >
        <p
          style={{
            fontSize: layout.textSize,
            fontFamily: currentTheme.fontFamily,
            color: currentTheme.textColor,
            margin: 0,
            textAlign: 'center',
            opacity: 0.8,
          }}
        >
          {lines[1]}
        </p>
      </div>

      {/* 底部标识 */}
      <div
        style={{
          position: 'absolute',
          bottom: layout.margin,
          display: 'flex',
          alignItems: 'center',
          gap: 15,
          opacity: interpolate(textProgress, [0, 1], [0, 0.6]),
        }}
      >
        <span
          style={{
            fontSize: layout.textSize * 0.8,
            fontFamily: currentTheme.fontFamily,
            color: currentTheme.primaryColor,
            fontWeight: 600,
          }}
        >
          Skill Router
        </span>
        <span
          style={{
            fontSize: layout.textSize * 0.7,
            fontFamily: currentTheme.fontFamily,
            color: currentTheme.textColor,
            opacity: 0.5,
          }}
        >
          给 Agent 一张技能目录
        </span>
      </div>
    </AbsoluteFill>
  );
};
