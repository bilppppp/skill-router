import { Composition } from 'remotion';
import { SkillRouterIntro } from './SkillRouterIntro';
import { layout, getTotalDurationInFrames } from './DesignSystem';
import { VIDEO_CONFIG } from './config';

export const RemotionRoot: React.FC = () => {
  const fps = VIDEO_CONFIG.fps;
  const durationInFrames = getTotalDurationInFrames(fps);

  return (
    <>
      <Composition
        id="SkillRouterIntro"
        component={SkillRouterIntro}
        durationInFrames={durationInFrames}
        fps={fps}
        width={layout.width}
        height={layout.height}
        defaultProps={{}}
      />
    </>
  );
};
