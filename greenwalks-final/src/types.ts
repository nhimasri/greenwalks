export type ActivityType = 'WALK' | 'CYCLE' | 'VEHICLE' | 'STILL';
export type ThemeType = 'light' | 'dark' | 'system';

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  points: number;
  type: 'CO2' | 'DISTANCE' | 'STREAK';
  isSuggested?: boolean;
}

export interface Trip {
  id: string;
  timestamp: number;
  distance: number;
  co2Saved: number;
  duration: number;
  activity: ActivityType;
}

export interface UserStats {
  user: User | null;
  totalDistance: number;
  totalCO2Saved: number;
  streakDays: number;
  lastActive: number;
  level: number;
  experience: number;
  ecoScore: number;
  ecoCredits: number;
  badges: string[]; // IDs of unlocked badges
  theme: ThemeType;
  challenges: Challenge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: (stats: UserStats) => boolean;
}
