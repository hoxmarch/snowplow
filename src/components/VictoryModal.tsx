import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Coins, Flame, CheckCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { PlayerStats } from '../types/game';

interface VictoryModalProps {
  stats: PlayerStats;
  onContinuePlowing: () => void;
  onRestartNewDay: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onContinuePlowing,
  onRestartNewDay,
}) => {
  useEffect(() => {
    // Confetti fanfare!
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#ffe082', '#ffb300', '#ffffff'],
    });
    fire(0.2, {
      spread: 60,
      colors: ['#42a5f5', '#90caf9', '#ffffff'],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-lg bg-[#0c182b] border-2 border-amber-400 rounded-3xl shadow-[0_20px_60px_rgba(245,158,11,0.3)] p-6 sm:p-8 text-center overflow-hidden">
        {/* Glow ambient background circle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-3xl p-3 shadow-xl border border-amber-200 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-slate-900" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-display font-black text-white mb-1">
          TOWN CLEARANCE COMPLETE!
        </h2>
        <p className="text-xs sm:text-sm text-amber-200 mb-6 font-medium">
          Mayor's Citation: You kept the roads open, hot cocoa running, and every neighbor safe!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-[#132541] border border-sky-400/20 rounded-2xl text-left">
            <div className="flex items-center gap-1.5 text-sky-300 text-xs font-bold mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Town Cleared</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
              {stats.percentCleared}%
            </div>
          </div>

          <div className="p-3 bg-[#132541] border border-sky-400/20 rounded-2xl text-left">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Cozy Coins</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 tabular-nums">
              {stats.coins}
            </div>
          </div>

          <div className="p-3 bg-[#132541] border border-sky-400/20 rounded-2xl text-left">
            <div className="flex items-center gap-1.5 text-orange-300 text-xs font-bold mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Max Combo</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-orange-300 tabular-nums">
              {stats.maxCombo}x
            </div>
          </div>

          <div className="p-3 bg-[#132541] border border-sky-400/20 rounded-2xl text-left">
            <div className="flex items-center gap-1.5 text-sky-300 text-xs font-bold mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Quests Complete</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
              {stats.activeQuestsCompleted}/{stats.totalQuests}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onContinuePlowing}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-extrabold text-sm rounded-xl shadow-lg border border-amber-200 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <span>Keep Plowing (Free Roam)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRestartNewDay}
            className="w-full py-2.5 px-4 bg-[#142642] hover:bg-[#1c355c] text-sky-200 hover:text-white font-bold text-xs rounded-xl border border-sky-400/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Fresh Snowfall</span>
          </button>
        </div>
      </div>
    </div>
  );
};
