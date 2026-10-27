export type GameState = 'title' | 'playing' | 'paused' | 'garage' | 'victory';

export type CameraViewMode = 'isometric' | 'chase' | 'topdown' | 'cinematic';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface PlowUpgrades {
  bladeWidthLevel: number; // 1 to 5 (Wider swath)
  engineLevel: number; // 1 to 5 (Speed & acceleration)
  saltSpreader: boolean; // Auto-clears a radius behind you
  snowCannonLevel: number; // 0 to 3 (Blasts snow outward with bonus score)
  paintColor: string; // Hex color for the plow body
  plowAccessory: 'none' | 'wreath' | 'antlers' | 'star' | 'duck';
}

export interface TownQuest {
  id: string;
  title: string;
  description: string;
  targetType: 'street' | 'driveway' | 'landmark' | 'total_snow';
  targetId?: string;
  requiredSnowCleared: number; // number of snow voxels to clear in area
  totalSnowInArea: number;
  rewardCoins: number;
  completed: boolean;
  active: boolean;
}

export interface PlayerStats {
  coins: number;
  totalSnowCleared: number; // Count of voxels cleared
  totalSnowInTown: number;
  percentCleared: number;
  currentCombo: number;
  maxCombo: number;
  comboTimer: number; // Countdown seconds before combo drops
  comboMultiplier: number;
  currentSpeed: number; // mph equivalent
  activeQuestsCompleted: number;
  totalQuests: number;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number;
  icon: string;
}
