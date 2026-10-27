import React, { useEffect, useRef } from 'react';
import { GameEngine, GameEngineCallbacks } from '../game/gameEngine';

interface GameCanvasProps {
  onEngineReady: (engine: GameEngine) => void;
  callbacks: GameEngineCallbacks;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onEngineReady, callbacks }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef<GameEngineCallbacks>(callbacks);

  // Keep callbacks ref updated without tearing down the WebGL scene
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current, {
      onStatsUpdate: (s) => callbacksRef.current.onStatsUpdate(s),
      onQuestCompleted: (q) => callbacksRef.current.onQuestCompleted(q),
      onAllClearedVictory: () => callbacksRef.current.onAllClearedVictory(),
      onComboMilestone: (m, t) => callbacksRef.current.onComboMilestone(m, t),
      onNotification: (t) => callbacksRef.current.onNotification(t),
    });

    onEngineReady(engine);

    return () => {
      engine.dispose();
    };
  }, [onEngineReady]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden" />;
};
