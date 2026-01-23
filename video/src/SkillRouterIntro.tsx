import { AbsoluteFill, Series } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

import { IntroScene } from './scenes/IntroScene';
import { PainPointScene } from './scenes/PainPointScene';
import { SolutionScene } from './scenes/SolutionScene';
import { FeaturesScene } from './scenes/FeaturesScene';
import { CTAScene } from './scenes/CTAScene';

import { sceneDurations } from './DesignSystem';
import { VIDEO_CONFIG } from './config';

export const SkillRouterIntro: React.FC = () => {
  const fps = VIDEO_CONFIG.fps;
  
  // 转换秒为帧
  const introFrames = Math.ceil(sceneDurations.intro * fps);
  const painPointFrames = Math.ceil(sceneDurations.painPoint * fps);
  const solutionFrames = Math.ceil(sceneDurations.solution * fps);
  const featuresFrames = Math.ceil(sceneDurations.features * fps);
  const ctaFrames = Math.ceil(sceneDurations.cta * fps);
  const transitionFrames = Math.ceil(sceneDurations.transition * fps);

  return (
    <AbsoluteFill>
      <TransitionSeries>
        {/* 场景 1: 开场标题 */}
        <TransitionSeries.Sequence durationInFrames={introFrames}>
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionFrames })}
        />

        {/* 场景 2: 痛点展示 */}
        <TransitionSeries.Sequence durationInFrames={painPointFrames}>
          <PainPointScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={linearTiming({ durationInFrames: transitionFrames })}
        />

        {/* 场景 3: 解决方案 */}
        <TransitionSeries.Sequence durationInFrames={solutionFrames}>
          <SolutionScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionFrames })}
        />

        {/* 场景 4: 功能列表 */}
        <TransitionSeries.Sequence durationInFrames={featuresFrames}>
          <FeaturesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-bottom' })}
          timing={linearTiming({ durationInFrames: transitionFrames })}
        />

        {/* 场景 5: 行动召唤 */}
        <TransitionSeries.Sequence durationInFrames={ctaFrames}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
