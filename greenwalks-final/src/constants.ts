import { UserStats } from './types';

export const EMISSION_FACTORS = {
  CAR_PER_KM: 120, // grams of CO2 per km
  BIKE_PER_KM: 0,
  WALK_PER_KM: 0,
};

export const SPEED_THRESHOLDS = {
  STILL: 0.5, // m/s (~1.8 km/h)
  WALK: 1.5, // m/s (~5.4 km/h)
  CYCLE: 7.0, // m/s (~25 km/h)
};

export const XP_PER_GRAM_CO2 = 0.5;
export const XP_LEVEL_BASE = 500;

export const BADGES_DATA = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Saved your first 100g of CO2',
    icon: 'Footprints',
    requirement: (stats: UserStats) => stats.totalCO2Saved >= 100,
  },
  {
    id: 'planet_protector',
    name: 'Planet Protector',
    description: 'Saved 10kg of CO2',
    icon: 'ShieldCheck',
    requirement: (stats: UserStats) => stats.totalCO2Saved >= 10000,
  },
  {
    id: 'cycle_king',
    name: 'Cycle King',
    description: 'Cycled more than 10km total',
    icon: 'Bike',
    requirement: (stats: UserStats) => stats.totalDistance >= 10000,
  },
  {
    id: 'streak_3',
    name: 'On Fire',
    description: 'Maintained a 3-day eco-streak',
    icon: 'Flame',
    requirement: (stats: UserStats) => stats.streakDays >= 3,
  }
];

