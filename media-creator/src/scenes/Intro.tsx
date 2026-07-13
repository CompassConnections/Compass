import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background} from '../components/Background';
import {Logo} from '../components/Logo';
import {FadeUp, useSceneFade} from '../components/Animations';
import {colors, DESIGN_HEIGHT, fonts} from '../theme';

// ─── Scene schedule (frames @ 30fps) ────────────────────────────────────────
const S = {
  logo: {from: 0, dur: 100},
  hook: {from: 95, dur: 120},
  what: {from: 210, dur: 135},
  features: {from: 340, dur: 185},
  vision: {from: 520, dur: 105},
  cta: {from: 620, dur: 130},
};
export const INTRO_DURATION = S.cta.from + S.cta.dur; // 750 frames ≈ 25s

// Wraps a scene so its whole content cross-fades at the edges — no hard pops.
const Scene: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const opacity = useSceneFade(dur);
  return (
    <AbsoluteFill
      style={{
        opacity,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 90px',
        textAlign: 'center',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div
    style={{
      fontFamily: fonts.display,
      color: colors.amberBright,
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: 6,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

// ─── Scene 1 — logo + wordmark ──────────────────────────────────────────────
const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 12, mass: 0.8}});
  const scale = interpolate(pop, [0, 1], [0.6, 1]);
  const spin = interpolate(pop, [0, 1], [-25, 0]);

  return (
    <Scene dur={S.logo.dur}>
      <div style={{transform: `scale(${scale}) rotate(${spin}deg)`}}>
        <Logo size={340} />
      </div>
      <FadeUp delay={16} style={{marginTop: 60}}>
        <div
          style={{
            fontFamily: fonts.display,
            color: colors.cream,
            fontSize: 118,
            fontWeight: 800,
            letterSpacing: 10,
          }}
        >
          COMPASS
        </div>
      </FadeUp>
      <FadeUp delay={28}>
        <div
          style={{
            fontFamily: fonts.serif,
            color: colors.amberBright,
            fontSize: 46,
            fontStyle: 'italic',
            marginTop: 8,
          }}
        >
          Find your people.
        </div>
      </FadeUp>
    </Scene>
  );
};

// ─── Scene 2 — the hook ─────────────────────────────────────────────────────
const HookScene: React.FC = () => (
  <Scene dur={S.hook.dur}>
    <FadeUp>
      <div
        style={{
          fontFamily: fonts.display,
          color: colors.cream,
          fontSize: 82,
          fontWeight: 800,
          lineHeight: 1.12,
        }}
      >
        Tired of endless{' '}
        <span style={{color: colors.amberLight}}>swiping</span>,{' '}
        <span style={{color: colors.amberLight}}>ads</span>, and{' '}
        <span style={{color: colors.amberLight}}>algorithms</span>?
      </div>
    </FadeUp>
    <FadeUp delay={26}>
      <div
        style={{
          fontFamily: fonts.serif,
          color: colors.amberBright,
          fontSize: 44,
          fontStyle: 'italic',
          marginTop: 44,
        }}
      >
        There's a better way to connect.
      </div>
    </FadeUp>
  </Scene>
);

// ─── Scene 3 — what Compass is ──────────────────────────────────────────────
const WhatScene: React.FC = () => (
  <Scene dur={S.what.dur}>
    <FadeUp>
      <Eyebrow>Meet Compass</Eyebrow>
    </FadeUp>
    <FadeUp delay={14} style={{marginTop: 34}}>
      <div
        style={{
          fontFamily: fonts.display,
          color: colors.cream,
          fontSize: 74,
          fontWeight: 800,
          lineHeight: 1.18,
        }}
      >
        A free, open platform for{' '}
        <span style={{color: colors.amberLight}}>deep, authentic</span>{' '}
        1-on-1 connections.
      </div>
    </FadeUp>
    <FadeUp delay={30} style={{marginTop: 40}}>
      <div
        style={{
          fontFamily: fonts.display,
          color: '#C9C0B4',
          fontSize: 40,
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        Built around your values, interests, and ideas —
        <br />
        not how you look.
      </div>
    </FadeUp>
  </Scene>
);

// ─── Scene 4 — features ─────────────────────────────────────────────────────
const FEATURES: {title: string; text: string}[] = [
  {title: 'Keyword search', text: 'Find people by what they love — Stoicism to indie film.'},
  {title: 'Smart notifications', text: 'We ping you when someone who fits joins.'},
  {title: 'Depth over swipes', text: 'Values and ideas first. Photos stay secondary.'},
  {title: 'Always free', text: 'No ads. No subscriptions. Your data is never sold.'},
  {title: 'Open & democratic', text: 'Community-owned, open source, run by a public constitution.'},
];

// The five feature cards are the tallest scene, so they compact on the shorter
// 4:5 post canvas to keep comfortable breathing room top and bottom.
const useFeatureSizing = () => {
  const {height} = useVideoConfig();
  const compact = height < DESIGN_HEIGHT; // true for the 4:5 post format
  return {
    compact,
    cardPad: compact ? '22px 32px' : '30px 36px',
    cardRadius: compact ? 22 : 26,
    titleSize: compact ? 40 : 46,
    textSize: compact ? 30 : 34,
    rowGap: compact ? 16 : 22,
    headerGap: compact ? 28 : 40,
  };
};

const FeatureRow: React.FC<{title: string; text: string; delay: number}> = ({
  title,
  text,
  delay,
}) => {
  const s = useFeatureSizing();
  return (
    <FadeUp delay={delay} distance={40}>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 28,
          background: 'rgba(247,244,239,0.05)',
          border: '1.5px solid rgba(220,171,113,0.22)',
          borderRadius: s.cardRadius,
          padding: s.cardPad,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 8,
            borderRadius: 8,
            background: `linear-gradient(${colors.amberBright}, ${colors.amberDeep})`,
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontFamily: fonts.display,
              color: colors.cream,
              fontSize: s.titleSize,
              fontWeight: 800,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: fonts.display,
              color: '#C1B8AB',
              fontSize: s.textSize,
              fontWeight: 500,
              marginTop: 6,
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </FadeUp>
  );
};

const FeaturesScene: React.FC = () => {
  const s = useFeatureSizing();
  return (
    <Scene dur={S.features.dur}>
      <div style={{width: '100%'}}>
        <FadeUp style={{marginBottom: s.headerGap}}>
          <Eyebrow>What makes us different</Eyebrow>
        </FadeUp>
        <div style={{display: 'flex', flexDirection: 'column', gap: s.rowGap}}>
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} title={f.title} text={f.text} delay={10 + i * 12} />
          ))}
        </div>
      </div>
    </Scene>
  );
};

// ─── Scene 5 — vision ───────────────────────────────────────────────────────
const VisionScene: React.FC = () => (
  <Scene dur={S.vision.dur}>
    <FadeUp>
      <Eyebrow>The vision</Eyebrow>
    </FadeUp>
    <FadeUp delay={16} style={{marginTop: 34}}>
      <div
        style={{
          fontFamily: fonts.serif,
          color: colors.cream,
          fontSize: 66,
          lineHeight: 1.28,
        }}
      >
        What{' '}
        <span style={{color: colors.amberLight, fontWeight: 700}}>Linux</span> is
        to software and{' '}
        <span style={{color: colors.amberLight, fontWeight: 700}}>Wikipedia</span>{' '}
        is to knowledge —
        <br />
        Compass is to{' '}
        <span style={{color: colors.amberBright, fontStyle: 'italic'}}>
          human connection.
        </span>
      </div>
    </FadeUp>
  </Scene>
);

// ─── Scene 6 — call to action ───────────────────────────────────────────────
const CtaScene: React.FC = () => (
  <Scene dur={S.cta.dur}>
    <FadeUp>
      <Logo size={200} />
    </FadeUp>
    <FadeUp delay={12} style={{marginTop: 46}}>
      <div
        style={{
          fontFamily: fonts.display,
          color: colors.cream,
          fontSize: 84,
          fontWeight: 800,
        }}
      >
        Join free today
      </div>
    </FadeUp>
    <FadeUp delay={22} style={{marginTop: 26}}>
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 56,
          fontWeight: 700,
          color: colors.espresso,
          background: `linear-gradient(${colors.amberBright}, ${colors.amber})`,
          padding: '20px 48px',
          borderRadius: 999,
          boxShadow: `0 20px 60px ${colors.amberDeep}66`,
        }}
      >
        compassmeet.com
      </div>
    </FadeUp>
    <FadeUp delay={34} style={{marginTop: 40}}>
      <div
        style={{
          fontFamily: fonts.display,
          color: colors.amberBright,
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        Open-source · Ad-free · Community-owned
      </div>
    </FadeUp>
  </Scene>
);

// ─── Composition ────────────────────────────────────────────────────────────
export const Intro: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: colors.ink}}>
      <Background />
      <Sequence from={S.logo.from} durationInFrames={S.logo.dur}>
        <LogoScene />
      </Sequence>
      <Sequence from={S.hook.from} durationInFrames={S.hook.dur}>
        <HookScene />
      </Sequence>
      <Sequence from={S.what.from} durationInFrames={S.what.dur}>
        <WhatScene />
      </Sequence>
      <Sequence from={S.features.from} durationInFrames={S.features.dur}>
        <FeaturesScene />
      </Sequence>
      <Sequence from={S.vision.from} durationInFrames={S.vision.dur}>
        <VisionScene />
      </Sequence>
      <Sequence from={S.cta.from} durationInFrames={S.cta.dur}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
};
