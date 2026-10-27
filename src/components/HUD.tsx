import React, { useState } from 'react';
import {
  Coins,
  Snowflake,
  Volume2,
  VolumeX,
  Camera,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sun,
  Sunset,
  Moon,
  Pause,
  Wrench,
  Megaphone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PlayerStats, CameraViewMode, TimeOfDay, TownQuest } from '../types/game';

interface HUDProps {
  stats: PlayerStats;
  currentQuest: TownQuest | null;
  cameraMode: CameraViewMode;
  timeOfDay: TimeOfDay;
  isMuted: boolean;
  notification: string | null;
  comboMilestone: { multiplier: number; text: string } | null;
  onToggleMute: () => void;
  onCycleCamera: () => void;
  onRotateCameraLeft: () => void;
  onRotateCameraRight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCycleTimeOfDay: () => void;
  onOpenGarage: () => void;
  onPause: () => void;
  onHonk: () => void;
  onVirtualMove?: (x: number, y: number) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  currentQuest,
  cameraMode,
  timeOfDay,
  isMuted,
  notification,
  comboMilestone,
  onToggleMute,
  onCycleCamera,
  onRotateCameraLeft,
  onRotateCameraRight,
  onZoomIn,
  onZoomOut,
  onCycleTimeOfDay,
  onOpenGarage,
  onPause,
  onHonk,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Time of Day icon
  const timeIcon =
    timeOfDay === 'day' ? (
      <Sun className="w-4 h-4 text-amber-300" />
    ) : timeOfDay === 'sunset' ? (
      <Sunset className="w-4 h-4 text-orange-400" />
    ) : (
      <Moon className="w-4 h-4 text-sky-200" />
    );

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* ================= TOP PERIMETER CLUSTER ================= */}
      <div className="flex justify-between items-start gap-3">
        {/* Top-Left: Coins, Cleared %, Combo Badge */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Main Status Capsule */}
          <div className="flex items-center gap-3 px-3.5 py-2 bg-[#0c192e]/90 border border-sky-500/30 rounded-2xl shadow-lg">
            {/* Cozy Coins */}
            <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-sm sm:text-base">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 drop-shadow" />
              <span className="tabular-nums tracking-wide">{stats.coins}</span>
            </div>

            <div className="w-[1px] h-4 bg-sky-700/50" />

            {/* Town Clearance Gauge */}
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-sky-300" />
              <div className="flex flex-col">
                <div className="flex justify-between text-[11px] font-bold text-sky-200 leading-none mb-1">
                  <span>TOWN CLEARED</span>
                  <span className="tabular-nums text-white ml-2">{stats.percentCleared}%</span>
                </div>
                <div className="w-24 sm:w-32 h-2 bg-slate-800 rounded-full overflow-hidden border border-sky-400/20">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-amber-300 transition-all duration-300 ease-out"
                    style={{ width: `${stats.percentCleared}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Combo Multiplier Badge */}
          {stats.currentCombo > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#d97706]/90 border border-amber-300/40 rounded-xl shadow-lg text-white font-extrabold text-xs sm:text-sm animate-pulse-once">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>
                {stats.comboMultiplier}x COMBO ·{' '}
                <span className="tabular-nums font-mono">{stats.currentCombo}</span> STREAK
              </span>
              <div className="w-12 h-1.5 bg-black/30 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full bg-amber-200 transition-all"
                  style={{ width: `${Math.min(100, (stats.comboTimer / 2.4) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Active Quest Card & Action Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Active Quest Capsule */}
          {currentQuest && (
            <div className="px-3.5 py-2 bg-[#0c192e]/90 border border-amber-400/30 rounded-2xl shadow-lg max-w-xs sm:max-w-sm text-right">
              <div className="flex items-center justify-end gap-1.5 text-amber-300 text-[11px] font-extrabold tracking-wider uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Town Quest</span>
              </div>
              <div className="text-white text-xs sm:text-sm font-bold truncate">
                {currentQuest.title}
              </div>
              <div className="text-sky-300 text-[11px] font-medium leading-tight mt-0.5">
                Reward: <strong className="text-amber-300 font-bold">+{currentQuest.rewardCoins} Coins</strong>
              </div>
            </div>
          )}

          {/* Quick Settings Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-[#0c192e]/90 border border-sky-500/30 rounded-2xl shadow-md">
            {/* Rotate Camera Angle Left */}
            <button
              onClick={onRotateCameraLeft}
              title="Rotate Camera Left (Q)"
              className="p-2 hover:bg-sky-900/60 rounded-xl text-sky-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Q</span>
            </button>

            {/* Rotate Camera Angle Right */}
            <button
              onClick={onRotateCameraRight}
              title="Rotate Camera Right (E)"
              className="p-2 hover:bg-sky-900/60 rounded-xl text-sky-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">E</span>
            </button>

            {/* Camera View Mode Preset Switcher */}
            <button
              onClick={onCycleCamera}
              title={`Camera Mode: ${cameraMode} (Click to switch or drag 3D view)`}
              className="p-2 hover:bg-sky-900/60 rounded-xl text-sky-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <Camera className="w-4 h-4 text-sky-300" />
            </button>

            {/* Zoom Controls */}
            <button
              onClick={onZoomIn}
              title="Zoom In"
              className="p-2 hover:bg-sky-900/60 rounded-xl text-sky-200 hover:text-white transition-colors cursor-pointer font-bold text-xs"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onZoomOut}
              title="Zoom Out"
              className="p-2 hover:bg-sky-900/60 rounded-xl text-sky-200 hover:text-white transition-colors cursor-pointer font-bold text-xs"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Time of Day Switcher */}
            <button
              onClick={onCycleTimeOfDay}
              title={`Time: ${timeOfDay}`}
              className="p-2 hover:bg-sky-900/60 rounded-xl text-sky-200 hover:text-white transition-colors cursor-pointer"
            >
              {timeIcon}
            </button>

            {/* Mute Toggle */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-2 hover:bg-sky-900/60 rounded-xl text-sky-200 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Pause Modal */}
            <button
              onClick={onPause}
              title="Pause Game (Esc)"
              className="p-2 hover:bg-sky-900/60 rounded-xl text-sky-200 hover:text-white transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= CENTER NOTIFICATIONS ================= */}
      <div className="self-center flex flex-col items-center gap-2 pointer-events-none mt-4">
        {notification && (
          <div className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 border-2 border-amber-200 text-slate-900 font-extrabold text-sm sm:text-base rounded-2xl shadow-2xl animate-bounce">
            {notification}
          </div>
        )}

        {comboMilestone && (
          <div className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 border border-sky-200 text-white font-display text-lg sm:text-xl font-black rounded-2xl shadow-2xl tracking-wider uppercase">
            {comboMilestone.text}
          </div>
        )}
      </div>

      {/* ================= BOTTOM DOCK (COLLAPSIBLE, ZERO OCCLUSION) ================= */}
      <div className="self-center flex flex-col items-center pointer-events-auto">
        {/* Toggle Collapse Pill */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1.5 px-3 py-1 bg-[#0c192e]/85 hover:bg-[#14284b] border border-sky-400/20 rounded-full text-[10px] font-bold text-sky-300 tracking-wider uppercase transition-colors cursor-pointer"
        >
          {isDockCollapsed ? '▴ Show Controls' : '▾ Zen Mode'}
        </button>

        {!isDockCollapsed && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0c192e]/95 border border-sky-400/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            {/* Speedometer */}
            <div className="flex flex-col items-center pr-2 border-r border-sky-800/40">
              <span className="text-[10px] font-bold text-sky-300 leading-tight">SPEED</span>
              <div className="text-base sm:text-lg font-black text-white tabular-nums leading-none">
                {stats.currentSpeed} <span className="text-xs font-normal text-sky-400">MPH</span>
              </div>
            </div>

            {/* Horn Button */}
            <button
              onClick={onHonk}
              className="px-3.5 py-2 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-900 font-extrabold text-xs sm:text-sm rounded-xl shadow border border-amber-200 flex items-center gap-1.5 cursor-pointer transition-transform"
            >
              <Megaphone className="w-4 h-4" />
              <span>HONK!</span>
            </button>

            {/* Upgrade Garage CTA */}
            <button
              onClick={onOpenGarage}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow border border-sky-300/40 flex items-center gap-2 cursor-pointer transition-transform"
            >
              <Wrench className="w-4 h-4 text-amber-300" />
              <span>GARAGE</span>
            </button>

            {/* Subtle Controls Hint */}
            <div className="hidden md:flex flex-col text-[10px] text-sky-300/80 border-l border-sky-800/40 pl-2 leading-tight">
              <span><strong className="text-amber-300">Arrow Keys</strong> Drive</span>
              <span><strong className="text-amber-300">Q / E / Drag</strong> Angle</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
