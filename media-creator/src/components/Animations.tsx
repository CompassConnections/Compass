import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Fade + rise, driven by a spring so motion feels physical rather than linear.
// `delay` is in frames, relative to the start of the enclosing <Sequence>.
export const FadeUp: React.FC<{
  delay?: number;
  distance?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({delay = 0, distance = 60, children, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: {damping: 200, mass: 0.6},
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [distance, 0]);

  return (
    <div style={{...style, opacity, transform: `translateY(${translateY}px)`}}>
      {children}
    </div>
  );
};

// Fade a scene out over its final `fadeFrames` frames so cuts never pop.
export const useSceneFade = (
  durationInFrames: number,
  fadeFrames = 12,
): number => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
};
