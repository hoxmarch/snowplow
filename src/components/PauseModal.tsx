import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, X, Truck } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="relative w-full max-w-md bg-[#0c182b] border-2 border-sky-400/40 rounded-3xl shadow-2xl p-6 text-center">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Game Paused</span>
          </div>
          <button
            onClick={onResume}
            className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-2xl font-display font-black text-white mb-2">FROSTY HOLLOW</h2>
        <p className="text-xs text-sky-200 mb-6">
          Take a cozy sip of cocoa before hopping back behind the wheel!
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-extrabold text-sm rounded-xl shadow-lg border border-amber-200 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-900" />
            <span>Resume Plowing</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 bg-[#142642] hover:bg-[#1a3258] text-white font-bold text-xs rounded-xl border border-sky-400/30 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? 'Unmute Sound & Music' : 'Mute Sound & Music'}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 bg-[#142642] hover:bg-[#1a3258] text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-sky-400/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Town Snow</span>
          </button>
        </div>

        {/* Controls Guide */}
        <div className="p-3.5 bg-[#11243e] rounded-xl border border-sky-500/20 text-left text-xs space-y-1.5 text-sky-200">
          <div className="font-bold text-white mb-1 uppercase text-[10px] tracking-wider">
            Controls Guide:
          </div>
          <div><strong className="text-amber-300">↑ ArrowUp</strong> : Drive Forward</div>
          <div><strong className="text-amber-300">↓ ArrowDown</strong> : Reverse</div>
          <div><strong className="text-amber-300">← / → Arrow Keys</strong> : Steer Snow Plow</div>
          <div><strong className="text-amber-300">Q / E (or Drag View)</strong> : Rotate 3D Camera Angle</div>
          <div><strong className="text-amber-300">Mouse Wheel</strong> : Zoom In / Out</div>
          <div><strong className="text-amber-300">Smash Snowmen ⛄</strong> : Break for +50 Bonus Coins!</div>
          <div><strong className="text-amber-300">Spacebar</strong> : Friendly Toot-Toot Horn</div>
        </div>
      </div>
    </div>
  );
};
