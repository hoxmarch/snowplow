/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from 'components/GameCanvas';
import { TitleScreen } from 'components/TitleScreen';
import { HUD } from 'components/HUD';
import { GarageModal } from 'components/GarageModal';
import { PauseModal } from 'components/PauseModal';
import { VictoryModal } from 'components/VictoryModal';
import { GameEngine } from 'game/gameEngine';
import { soundManager } from 'audio/soundManager';
import { GameState, PlayerStats, PlowUpgrades, CameraViewMode, TimeOfDay, TownQuest } from './types/game';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const engineRef = useRef<GameEngine | null>(null);

  const [stats, setStats] = useState<PlayerStats>({
    coins: 50, // Starting pocket coins
    totalSnowCleared: 0,
    totalSnowInTown: 1000,
    percentCleared: 0,
    currentCombo: 0,
    maxCombo: 0,
    comboTimer: 0,
    comboMultiplier: 1,
    currentSpeed: 0,
    activeQuestsCompleted: 0,
    totalQuests: 6,
  });

  const [upgrades, setUpgrades] = useState<PlowUpgrades>({
    bladeWidthLevel: 1,
    engineLevel: 1,
    saltSpreader: false,
    snowCannonLevel: 0,
    paintColor: '#f9a825',
    plowAccessory: 'none',
  });

  const [cameraMode, setCameraMode] = useState<CameraViewMode>('isometric');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [comboMilestone, setComboMilestone] = useState<{ multiplier: number; text: string } | null>(null);
  const [currentQuest, setCurrentQuest] = useState<TownQuest | null>(null);

  const notifTimeoutRef = useRef<number | null>(null);
  const comboTimeoutRef = useRef<number | null>(null);

  // Bind engine instance
  const handleEngineReady = useCallback((engine: GameEngine) => {
    engineRef.current = engine;
    engine.addCoins(50); // Start bonus
    // Find initial active quest
    const firstActive = engine.quests.find((q) => q.active && !q.completed) || null;
    setCurrentQuest(firstActive);
  }, []);

  const triggerNotification = useCallback((text: string) => {
    setNotification(text);
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    notifTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 3200);
  }, []);

  const triggerComboMilestone = useCallback((multiplier: number, text: string) => {
    setComboMilestone({ multiplier, text });
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    comboTimeoutRef.current = window.setTimeout(() => {
      setComboMilestone(null);
    }, 2200);
  }, []);

  // Callbacks provided to gameEngine
  const engineCallbacks = useRef({
    onStatsUpdate: (newStats: PlayerStats) => {
      setStats((prev) => ({
        ...prev,
        ...newStats,
      }));
    },
    onQuestCompleted: (quest: TownQuest) => {
      triggerNotification(`Quest Completed! "${quest.title}" (+${quest.rewardCoins} Coins!)`);
      if (engineRef.current) {
        const nextActive = engineRef.current.quests.find((q) => q.active && !q.completed) || null;
        setCurrentQuest(nextActive);
      }
    },
    onAllClearedVictory: () => {
      setGameState('victory');
    },
    onComboMilestone: (multiplier: number, text: string) => {
      triggerComboMilestone(multiplier, text);
    },
    onNotification: (text: string) => {
      triggerNotification(text);
    },
  });

  // Handle Start Game
  const handleStartGame = () => {
    soundManager.resume();
    soundManager.startMusic();
    if (engineRef.current) {
      engineRef.current.isTitleScreen = false;
      engineRef.current.isPaused = false;
    }
    setGameState('playing');
  };

  // Handle Pause
  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.isPaused = true;
    }
    setGameState('paused');
  };

  // Handle Resume
  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.isPaused = false;
    }
    setGameState('playing');
  };

  // Handle Restart
  const handleRestart = () => {
    window.location.reload();
  };

  // Handle Upgrades
  const handleUpgrade = (
    type: 'blade' | 'engine' | 'salt' | 'cannon' | 'color' | 'accessory',
    value?: string
  ) => {
    if (!engineRef.current) return;

    const costs: Record<string, number> = {
      blade: [0, 80, 180, 320, 500][upgrades.bladeWidthLevel] || 0,
      engine: [0, 90, 200, 350, 550][upgrades.engineLevel] || 0,
      salt: 250,
      cannon: [150, 300, 480][upgrades.snowCannonLevel] || 0,
    };

    const cost = costs[type] || 0;
    if (cost > 0) {
      if (!engineRef.current.spendCoins(cost)) return;
    }

    engineRef.current.applyUpgrade(type, value);
    setUpgrades({ ...engineRef.current.upgrades });
    setStats((prev) => ({ ...prev, coins: engineRef.current!.getCoins() }));
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMute(nextMuted);
  };

  // Cycle Camera Mode
  const handleCycleCamera = () => {
    const modes: CameraViewMode[] = ['isometric', 'chase', 'topdown'];
    const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setCameraMode(nextMode);
    if (engineRef.current) {
      engineRef.current.setCameraMode(nextMode);
    }
    triggerNotification(`Camera: ${nextMode.toUpperCase()}`);
  };

  // Cycle Time of Day
  const handleCycleTimeOfDay = () => {
    const times: TimeOfDay[] = ['day', 'sunset', 'night'];
    const nextIdx = (times.indexOf(timeOfDay) + 1) % times.length;
    const nextTime = times[nextIdx];
    setTimeOfDay(nextTime);
    if (engineRef.current) {
      engineRef.current.setTimeOfDay(nextTime);
    }
    triggerNotification(`Atmosphere: ${nextTime.toUpperCase()}`);
  };

  // Camera Angle & Zoom Controls
  const handleRotateCameraLeft = () => {
    if (engineRef.current) {
      engineRef.current.rotateCameraBy(Math.PI / 4);
    }
  };

  const handleRotateCameraRight = () => {
    if (engineRef.current) {
      engineRef.current.rotateCameraBy(-Math.PI / 4);
    }
  };

  const handleZoomIn = () => {
    if (engineRef.current) {
      engineRef.current.zoomCamera(-5);
    }
  };

  const handleZoomOut = () => {
    if (engineRef.current) {
      engineRef.current.zoomCamera(5);
    }
  };

  // Honk
  const handleHonk = () => {
    if (engineRef.current) {
      engineRef.current.triggerHonk();
    }
  };

  // Listen for Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'playing') {
          handlePause();
        } else if (gameState === 'paused' || gameState === 'garage') {
          handleResume();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b1526]">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas onEngineReady={handleEngineReady} callbacks={engineCallbacks.current} />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenGarage={() => setGameState('garage')}
          coins={stats.coins}
        />
      )}

      {/* Live In-Game Perimeter HUD */}
      {gameState === 'playing' && (
        <HUD
          stats={stats}
          currentQuest={currentQuest}
          cameraMode={cameraMode}
          timeOfDay={timeOfDay}
          isMuted={isMuted}
          notification={notification}
          comboMilestone={comboMilestone}
          onToggleMute={handleToggleMute}
          onCycleCamera={handleCycleCamera}
          onRotateCameraLeft={handleRotateCameraLeft}
          onRotateCameraRight={handleRotateCameraRight}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onCycleTimeOfDay={handleCycleTimeOfDay}
          onOpenGarage={() => setGameState('garage')}
          onPause={handlePause}
          onHonk={handleHonk}
        />
      )}

      {/* Upgrades Garage Modal */}
      {gameState === 'garage' && (
        <GarageModal
          upgrades={upgrades}
          coins={stats.coins}
          onUpgrade={handleUpgrade}
          onClose={() => setGameState(engineRef.current?.isTitleScreen ? 'title' : 'playing')}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Victory Celebration Modal */}
      {gameState === 'victory' && (
        <VictoryModal
          stats={stats}
          onContinuePlowing={() => setGameState('playing')}
          onRestartNewDay={handleRestart}
        />
      )}
    </div>
  );
}
