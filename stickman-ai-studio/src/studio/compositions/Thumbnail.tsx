import React from 'react';
import { AbsoluteFill } from 'remotion';
import { LivingRoom } from '../backgrounds/LivingRoom';
import { Stickman } from '../characters/Stickman';
import { FAMILY } from '../characters/family';
import { EMOTIONS, applyLipSync } from '../faces/emotions';
import { brace, HOLD, idle, STARTLE } from '../animations/poses';
import { ChristmasTree } from '../props/ChristmasTree';
import { GiftBox } from '../props/Props';
import { cameraTransform } from '../camera/camera';

/**
 * Thumbnail: the moment the tree is going over. Frank braces, Ben is shocked at the viewer,
 * Max holds a present. Headline is set in HTML so it stays sharp at any size.
 */
export const Thumbnail: React.FC = () => {
  const cam = { x: 960, y: 540, zoom: 1.02 };
  const floor = 900;
  return (
    <AbsoluteFill style={{ background: '#0c1020' }}>
      <svg width={1280} height={720} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
        <g transform={cameraTransform(cam, 1920, 1080)}>
          <LivingRoom frame={0} t={0} camX={cam.x} />
          <ChristmasTree x={1080} baseY={floor} height={560} tip={0.42} starOff={0.6} frame={0} />
          <GiftBox x={1560} y={floor} w={90} h={70} color="#1565c0" />
          <Stickman x={330} groundY={floor} spec={FAMILY.max} pose={HOLD} face={applyLipSync(EMOTIONS.excited, 0)} blink={0} facing={1} zoom={1.1} />
          <Stickman x={620} groundY={floor} spec={FAMILY.ben} pose={STARTLE} face={applyLipSync(EMOTIONS.surprise, 0)} blink={0} facing={1} zoom={1.2} />
          <Stickman x={1260} groundY={floor} spec={FAMILY.frank} pose={brace(0)} face={applyLipSync(EMOTIONS.fear, 0)} blink={0} facing={-1} zoom={1.12} />
          <Stickman x={1620} groundY={floor} spec={FAMILY.diane} pose={idle(0, 3)} face={applyLipSync(EMOTIONS.angry, 0)} blink={0} facing={-1} zoom={1} opacity={0.0} />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 36,
          top: 28,
          fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
          fontWeight: 900,
          fontSize: 112,
          lineHeight: 0.95,
          color: '#ffd54f',
          letterSpacing: 1,
          textShadow: '0 6px 0 #5a0f0f, 0 0 26px rgba(0,0,0,0.6)',
          WebkitTextStroke: '3px #3a0a0a',
        }}
      >
        CHRISTMAS
        <br />
        CHAOS!
      </div>
    </AbsoluteFill>
  );
};
