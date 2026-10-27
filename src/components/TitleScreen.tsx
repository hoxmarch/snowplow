import React, { useEffect } from 'react';
import { Snowflake, Play, Sparkles, Volume2, Truck } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenGarage: () => void;
  coins: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame, onOpenGarage, coins }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-12 z-20 select-none">
      {/* Top Bar with Badge */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#12233f]/90 border border-amber-300/30 rounded-2xl shadow-lg text-amber-200">
          <Truck className="w-5 h-5 text-amber-400" />
          <span className="text-xs uppercase tracking-wider font-bold">Public Works Dept</span>
          <span className="text-amber-300 font-semibold text-sm">· Frosty Hollow</span>
        </div>

        {coins > 0 && (
          <button
            onClick={onOpenGarage}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a2d4c]/90 hover:bg-[#233c64] border border-sky-400/30 rounded-2xl shadow-lg text-amber-300 transition-transform active:scale-95 cursor-pointer font-bold"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="tabular-nums">{coins}</span> Coins · Visit Garage
          </button>
        )}
      </div>

      {/* Center Title Lockup over negative space */}
      <div className="max-w-xl mx-auto text-center flex flex-col items-center">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="relative mb-3 flex items-center justify-center">
          <svg viewBox="0 0 460 120" className="w-80 sm:w-96 md:w-[460px] drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
            <defs>
              <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#e1f5fe" />
                <stop offset="100%" stopColor="#81d4fa" />
              </linearGradient>
              <linearGradient id="amberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffe082" />
                <stop offset="100%" stopColor="#ffb300" />
              </linearGradient>
              <filter id="cozyGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Snowy Cloud Pill */}
            <path
              d="M 40,65 Q 20,40 60,30 Q 90,10 140,25 Q 180,5 230,20 Q 280,5 330,22 Q 380,10 410,35 Q 445,45 435,75 Q 445,105 400,105 L 60,105 Q 20,105 40,65 Z"
              fill="#0f2342"
              fillOpacity="0.85"
              stroke="#64b5f6"
              strokeWidth="3"
            />

            {/* Cute Snowdrifts on top */}
            <path
              d="M 50,34 Q 80,18 115,26 Q 160,14 200,24 Q 240,12 280,22 Q 330,14 365,24 Q 405,18 420,38"
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Main Title Text */}
            <text
              x="230"
              y="68"
              textAnchor="middle"
              className="font-display"
              fontWeight="900"
              fontSize="48"
              letterSpacing="2"
              fill="url(#snowGrad)"
              stroke="#0d47a1"
              strokeWidth="3"
              style={{ paintOrder: 'stroke fill' }}
            >
              FROSTY HOLLOW
            </text>

            {/* Sub-banner ribbon */}
            <rect x="110" y="80" width="240" height="26" rx="13" fill="#ff9800" stroke="#fff" strokeWidth="1.5" />
            <text
              x="230"
              y="97"
              textAnchor="middle"
              className="font-display"
              fontWeight="800"
              fontSize="14"
              letterSpacing="3"
              fill="#ffffff"
            >
              COZY SNOW PLOW 3D
            </text>
          </svg>
        </div>

        <p className="text-sky-100 text-sm md:text-base font-medium max-w-md drop-shadow mb-6">
          Hop into your friendly town snow plow! Clear the quiet Midwestern streets, rescue snowy driveways, and rack up combo multipliers.
        </p>

        {/* Primary Start CTA Button */}
        <div className="pointer-events-auto flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onStartGame}
            className="group px-8 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-extrabold text-lg rounded-2xl shadow-[0_8px_25px_rgba(245,158,11,0.5)] border-2 border-amber-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-slate-900" />
            <span>START PLOWING</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="px-6 py-3.5 bg-[#12233f]/90 hover:bg-[#1a345c] text-sky-200 hover:text-white font-bold text-sm rounded-2xl border border-sky-400/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Plow Garage & Upgrades</span>
          </button>
        </div>
      </div>

      {/* Bottom Control-Hint Line */}
      <div className="text-center pointer-events-auto">
        <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-5 py-2.5 bg-[#0b172a]/85 border border-sky-500/20 rounded-full text-xs font-semibold text-sky-200 tracking-wide shadow-md">
          <span><strong className="text-amber-300">Arrow Keys</strong> Drive</span>
          <span className="text-slate-500">·</span>
          <span><strong className="text-amber-300">Q / E / Drag</strong> Rotate Camera</span>
          <span className="text-slate-500">·</span>
          <span><strong className="text-amber-300">Smash Snowmen ⛄</strong> +50 Coins</span>
          <span className="text-slate-500">·</span>
          <span><strong className="text-amber-300">Space</strong> Toot-Toot Horn</span>
          <span className="text-slate-500">·</span>
          <span><strong className="text-amber-300">Esc</strong> Pause</span>
        </div>
      </div>
    </div>
  );
};
