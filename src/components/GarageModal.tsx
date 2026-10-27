import React from 'react';
import { X, Wrench, Coins, Zap, Shield, Sparkles, Check, Flame } from 'lucide-react';
import { PlowUpgrades } from '../types/game';

interface GarageModalProps {
  upgrades: PlowUpgrades;
  coins: number;
  onUpgrade: (type: 'blade' | 'engine' | 'salt' | 'cannon' | 'color' | 'accessory', value?: string) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({ upgrades, coins, onUpgrade, onClose }) => {
  const bladeCosts = [0, 80, 180, 320, 500];
  const engineCosts = [0, 90, 200, 350, 550];
  const saltCost = 250;
  const cannonCosts = [150, 300, 480];

  const paintColors = [
    { label: 'Sunshine Yellow', hex: '#f9a825' },
    { label: 'Nordic Blue', hex: '#42a5f5' },
    { label: 'Berry Red', hex: '#e53935' },
    { label: 'Pine Forest', hex: '#2e7d32' },
    { label: 'Pumpkin Glow', hex: '#f57c00' },
    { label: 'Midnight Plum', hex: '#7b1fa2' },
  ];

  const accessories: { id: PlowUpgrades['plowAccessory']; label: string; desc: string }[] = [
    { id: 'none', label: 'None', desc: 'Clean stock grill' },
    { id: 'wreath', label: 'Holiday Wreath', desc: 'Festive spruce wreath on grill' },
    { id: 'antlers', label: 'Moose Antlers', desc: 'Antlers & bright red nose' },
    { id: 'star', label: 'Golden Star', desc: 'Glowing holiday star on hood' },
    { id: 'duck', label: 'Rubber Duck', desc: 'Friendly mascot on hood' },
  ];

  const nextBladeCost = upgrades.bladeWidthLevel < 5 ? bladeCosts[upgrades.bladeWidthLevel] : null;
  const nextEngineCost = upgrades.engineLevel < 5 ? engineCosts[upgrades.engineLevel] : null;
  const nextCannonCost = upgrades.snowCannonLevel < 3 ? cannonCosts[upgrades.snowCannonLevel] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="relative w-full max-w-2xl bg-[#0c182b] border-2 border-sky-400/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#11243e] border-b border-sky-400/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/20 rounded-xl border border-amber-300/40">
              <Wrench className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-display font-extrabold text-white leading-tight">
                Frosty Hollow Custom Garage
              </h2>
              <p className="text-xs text-sky-300">Upgrade your plow blade, horsepower, attachments & style</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 border border-amber-300/40 rounded-xl text-amber-300 font-extrabold text-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="tabular-nums">{coins}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrades Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Core Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blade Width Upgrade */}
            <div className="p-4 bg-[#142642] border border-sky-500/20 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-sm">Blade Swath Width</span>
                  </div>
                  <span className="text-xs font-bold text-amber-300">Lv {upgrades.bladeWidthLevel}/5</span>
                </div>
                <p className="text-xs text-sky-200 mb-3">
                  Widens your front plow blade to sweep clean wider paths in a single pass.
                </p>
              </div>

              {upgrades.bladeWidthLevel < 5 ? (
                <button
                  disabled={coins < (nextBladeCost || 0)}
                  onClick={() => onUpgrade('blade')}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    coins >= (nextBladeCost || 0)
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-lg active:scale-95'
                      : 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Upgrade ({nextBladeCost} Coins)</span>
                </button>
              ) : (
                <div className="py-2 px-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-center text-xs font-bold text-emerald-300">
                  MAX LEVEL REACHED
                </div>
              )}
            </div>

            {/* Engine & Speed Upgrade */}
            <div className="p-4 bg-[#142642] border border-sky-500/20 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <span className="font-bold text-white text-sm">Engine Horsepower</span>
                  </div>
                  <span className="text-xs font-bold text-orange-300">Lv {upgrades.engineLevel}/5</span>
                </div>
                <p className="text-xs text-sky-200 mb-3">
                  Increases top driving speed and winter road acceleration.
                </p>
              </div>

              {upgrades.engineLevel < 5 ? (
                <button
                  disabled={coins < (nextEngineCost || 0)}
                  onClick={() => onUpgrade('engine')}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    coins >= (nextEngineCost || 0)
                      ? 'bg-orange-400 hover:bg-orange-300 text-slate-900 shadow-lg active:scale-95'
                      : 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Upgrade ({nextEngineCost} Coins)</span>
                </button>
              ) : (
                <div className="py-2 px-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-center text-xs font-bold text-emerald-300">
                  MAX LEVEL REACHED
                </div>
              )}
            </div>

            {/* Salt Spreader Attachment */}
            <div className="p-4 bg-[#142642] border border-sky-500/20 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-300" />
                    <span className="font-bold text-white text-sm">Rear Salt Spreader</span>
                  </div>
                  <span className="text-xs font-bold text-sky-300">
                    {upgrades.saltSpreader ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
                <p className="text-xs text-sky-200 mb-3">
                  Mounts a spinning salt hopper on the rear that automatically melts snow around you!
                </p>
              </div>

              {!upgrades.saltSpreader ? (
                <button
                  disabled={coins < saltCost}
                  onClick={() => onUpgrade('salt')}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    coins >= saltCost
                      ? 'bg-sky-400 hover:bg-sky-300 text-slate-900 shadow-lg active:scale-95'
                      : 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Unlock Attachment ({saltCost} Coins)</span>
                </button>
              ) : (
                <div className="py-2 px-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-center text-xs font-bold text-emerald-300">
                  INSTALLED ON REAR BED
                </div>
              )}
            </div>

            {/* Snow Cannon Ejection */}
            <div className="p-4 bg-[#142642] border border-sky-500/20 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white text-sm">Snow Cannon Ejection</span>
                  </div>
                  <span className="text-xs font-bold text-purple-300">Lv {upgrades.snowCannonLevel}/3</span>
                </div>
                <p className="text-xs text-sky-200 mb-3">
                  Blasts plowed snow high into arching plumes with sparkling particle showers.
                </p>
              </div>

              {upgrades.snowCannonLevel < 3 ? (
                <button
                  disabled={coins < (nextCannonCost || 0)}
                  onClick={() => onUpgrade('cannon')}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    coins >= (nextCannonCost || 0)
                      ? 'bg-purple-400 hover:bg-purple-300 text-slate-900 shadow-lg active:scale-95'
                      : 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Upgrade Cannon ({nextCannonCost} Coins)</span>
                </button>
              ) : (
                <div className="py-2 px-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-center text-xs font-bold text-emerald-300">
                  MAX LEVEL REACHED
                </div>
              )}
            </div>
          </div>

          {/* 2. Custom Truck Colors */}
          <div>
            <h3 className="text-sm font-extrabold text-white mb-2 uppercase tracking-wide">
              Custom Body Paint
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {paintColors.map((color) => {
                const isSelected = upgrades.paintColor === color.hex;
                return (
                  <button
                    key={color.hex}
                    onClick={() => onUpgrade('color', color.hex)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-300 bg-amber-400/10'
                        : 'border-sky-500/20 hover:border-sky-400/50 bg-[#142642]'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full shadow-inner border border-white/20 flex items-center justify-center"
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">
                      {color.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Mascot Hood Ornaments */}
          <div>
            <h3 className="text-sm font-extrabold text-white mb-2 uppercase tracking-wide">
              Mascot & Hood Ornaments
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {accessories.map((acc) => {
                const isSelected = upgrades.plowAccessory === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => onUpgrade('accessory', acc.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-300 bg-amber-400/15'
                        : 'border-sky-500/20 hover:border-sky-400/50 bg-[#142642]'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-white flex items-center justify-between mb-1">
                      <span>{acc.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </div>
                    <p className="text-[10px] text-sky-300 leading-tight">{acc.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#11243e] border-t border-sky-400/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-900 font-extrabold text-sm rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Back to Plowing
          </button>
        </div>
      </div>
    </div>
  );
};
