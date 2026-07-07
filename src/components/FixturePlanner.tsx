import { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  Check, 
  Sliders 
} from 'lucide-react';

interface TeamFixture {
  opponent: string;
  opponentAbbr: string;
  isHome: boolean;
  baseDifficulty: number; // 1 to 5
  date: string;
  mockOdds: { home: number; draw: number; away: number };
}

interface TeamData {
  name: string;
  abbr: string;
  strength: number; // base team strength 1-5
  avatarColor: string;
  fixtures: TeamFixture[];
}

// 1. Initial Schedule Data for Spieltage 1 to 5 (mapped exactly from the PDF Spielplan 26/27)
const INITIAL_TEAMS: TeamData[] = [
  {
    name: 'FC Bayern München',
    abbr: 'FCB',
    strength: 5,
    avatarColor: 'from-red-600 to-red-950',
    fixtures: [
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, baseDifficulty: 4, date: '28.08.2026', mockOdds: { home: 1.45, draw: 4.80, away: 5.80 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: false, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 6.20, draw: 5.10, away: 1.35 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 8.50, draw: 5.50, away: 1.25 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: true, baseDifficulty: 3, date: '19.09.2026', mockOdds: { home: 1.30, draw: 5.25, away: 8.00 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 5.50, draw: 4.20, away: 1.48 } }
    ]
  },
  {
    name: 'Bayer 04 Leverkusen',
    abbr: 'B04',
    strength: 5,
    avatarColor: 'from-red-600 to-black',
    fixtures: [
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 7.80, draw: 5.00, away: 1.30 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: true, baseDifficulty: 3, date: '05.09.2026', mockOdds: { home: 1.40, draw: 4.50, away: 6.50 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 5.80, draw: 4.00, away: 1.45 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, baseDifficulty: 5, date: '19.09.2026', mockOdds: { home: 2.15, draw: 3.40, away: 3.10 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, baseDifficulty: 3, date: '10.10.2026', mockOdds: { home: 4.50, draw: 3.80, away: 1.65 } }
    ]
  },
  {
    name: 'Borussia Dortmund',
    abbr: 'BVB',
    strength: 5,
    avatarColor: 'from-yellow-500 to-black',
    fixtures: [
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 1.35, draw: 5.00, away: 7.20 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, baseDifficulty: 3, date: '05.09.2026', mockOdds: { home: 3.80, draw: 3.65, away: 1.85 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 1.25, draw: 5.50, away: 9.00 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '19.09.2026', mockOdds: { home: 4.20, draw: 3.60, away: 1.75 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, baseDifficulty: 3, date: '10.10.2026', mockOdds: { home: 1.50, draw: 4.20, away: 5.50 } }
    ]
  },
  {
    name: 'RB Leipzig',
    abbr: 'RBL',
    strength: 5,
    avatarColor: 'from-blue-600 to-red-600',
    fixtures: [
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, baseDifficulty: 3, date: '29.08.2026', mockOdds: { home: 1.55, draw: 4.00, away: 5.00 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, baseDifficulty: 3, date: '05.09.2026', mockOdds: { home: 4.20, draw: 3.80, away: 1.70 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 1.30, draw: 5.00, away: 8.00 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, baseDifficulty: 5, date: '19.09.2026', mockOdds: { home: 2.15, draw: 3.40, away: 3.10 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, baseDifficulty: 4, date: '10.10.2026', mockOdds: { home: 1.65, draw: 3.90, away: 4.50 } }
    ]
  },
  {
    name: 'VfB Stuttgart',
    abbr: 'VFB',
    strength: 4,
    avatarColor: 'from-red-500 to-white',
    fixtures: [
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, baseDifficulty: 5, date: '28.08.2026', mockOdds: { home: 1.45, draw: 4.80, away: 5.80 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 1.60, draw: 3.90, away: 4.80 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, baseDifficulty: 3, date: '12.09.2026', mockOdds: { home: 3.40, draw: 3.50, away: 2.05 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, baseDifficulty: 5, date: '19.09.2026', mockOdds: { home: 2.45, draw: 3.50, away: 2.60 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 4.50, draw: 3.80, away: 1.68 } }
    ]
  },
  {
    name: 'Eintracht Frankfurt',
    abbr: 'SGE',
    strength: 4,
    avatarColor: 'from-black to-red-600',
    fixtures: [
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '29.08.2026', mockOdds: { home: 2.70, draw: 3.30, away: 2.45 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: true, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 1.65, draw: 3.80, away: 4.50 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, baseDifficulty: 3, date: '12.09.2026', mockOdds: { home: 3.10, draw: 3.30, away: 2.20 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, baseDifficulty: 4, date: '19.09.2026', mockOdds: { home: 2.10, draw: 3.40, away: 3.25 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, baseDifficulty: 5, date: '10.10.2026', mockOdds: { home: 1.65, draw: 3.90, away: 4.50 } }
    ]
  },
  {
    name: 'Sport-Club Freiburg',
    abbr: 'SCF',
    strength: 4,
    avatarColor: 'from-red-600 to-black',
    fixtures: [
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, baseDifficulty: 3, date: '29.08.2026', mockOdds: { home: 1.85, draw: 3.60, away: 3.80 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 3.90, draw: 3.50, away: 1.88 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, baseDifficulty: 3, date: '12.09.2026', mockOdds: { home: 2.00, draw: 3.40, away: 3.45 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, baseDifficulty: 4, date: '19.09.2026', mockOdds: { home: 2.10, draw: 3.40, away: 3.25 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 1.70, draw: 3.70, away: 4.50 } }
    ]
  },
  {
    name: 'TSG Hoffenheim',
    abbr: 'TSG',
    strength: 3,
    avatarColor: 'from-blue-600 to-blue-900',
    fixtures: [
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: false, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 2.65, draw: 3.40, away: 2.45 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, baseDifficulty: 5, date: '05.09.2026', mockOdds: { home: 3.80, draw: 3.65, away: 1.85 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, baseDifficulty: 4, date: '12.09.2026', mockOdds: { home: 3.40, draw: 3.50, away: 2.05 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 3.20, draw: 3.40, away: 2.10 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 1.85, draw: 3.60, away: 3.75 } }
    ]
  },
  {
    name: 'SV Werder Bremen',
    abbr: 'SVW',
    strength: 3,
    avatarColor: 'from-emerald-600 to-black',
    fixtures: [
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, baseDifficulty: 4, date: '29.08.2026', mockOdds: { home: 1.85, draw: 3.60, away: 3.80 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, baseDifficulty: 5, date: '05.09.2026', mockOdds: { home: 4.20, draw: 3.80, away: 1.70 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: false, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 2.30, draw: 3.40, away: 2.80 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: true, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 2.00, draw: 3.40, away: 3.50 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, baseDifficulty: 5, date: '10.10.2026', mockOdds: { home: 1.50, draw: 4.20, away: 5.50 } }
    ]
  },
  {
    name: 'Borussia Mönchengladbach',
    abbr: 'BMG',
    strength: 3,
    avatarColor: 'from-gray-500 to-black',
    fixtures: [
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, baseDifficulty: 5, date: '29.08.2026', mockOdds: { home: 1.55, draw: 4.00, away: 5.00 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 1.80, draw: 3.50, away: 4.20 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, baseDifficulty: 4, date: '12.09.2026', mockOdds: { home: 2.00, draw: 3.40, away: 3.45 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: true, baseDifficulty: 3, date: '19.09.2026', mockOdds: { home: 2.20, draw: 3.30, away: 3.10 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 2.80, draw: 3.30, away: 2.35 } }
    ]
  },
  {
    name: '1. FC Union Berlin',
    abbr: 'FCU',
    strength: 3,
    avatarColor: 'from-red-500 to-black',
    fixtures: [
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, baseDifficulty: 4, date: '29.08.2026', mockOdds: { home: 2.70, draw: 3.30, away: 2.45 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, baseDifficulty: 5, date: '05.09.2026', mockOdds: { home: 1.40, draw: 4.50, away: 6.50 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.65 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, baseDifficulty: 5, date: '19.09.2026', mockOdds: { home: 1.30, draw: 5.25, away: 8.00 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 1.80, draw: 3.50, away: 4.20 } }
    ]
  },
  {
    name: 'FC Augsburg',
    abbr: 'FCA',
    strength: 2,
    avatarColor: 'from-emerald-700 to-red-600',
    fixtures: [
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 2.10, draw: 3.30, away: 3.25 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, baseDifficulty: 4, date: '05.09.2026', mockOdds: { home: 1.65, draw: 3.80, away: 4.50 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: true, baseDifficulty: 5, date: '12.09.2026', mockOdds: { home: 5.80, draw: 4.00, away: 1.45 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, baseDifficulty: 3, date: '19.09.2026', mockOdds: { home: 2.00, draw: 3.40, away: 3.50 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, baseDifficulty: 5, date: '10.10.2026', mockOdds: { home: 5.50, draw: 4.20, away: 1.48 } }
    ]
  },
  {
    name: '1. FSV Mainz 05',
    abbr: 'M05',
    strength: 3,
    avatarColor: 'from-red-600 to-white',
    fixtures: [
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.60 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 2.60, draw: 3.30, away: 2.50 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, baseDifficulty: 4, date: '12.09.2026', mockOdds: { home: 3.10, draw: 3.30, away: 2.20 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, baseDifficulty: 5, date: '19.09.2026', mockOdds: { home: 4.50, draw: 3.80, away: 1.65 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 2.65, draw: 3.30, away: 2.45 } }
    ]
  },
  {
    name: 'Hamburger SV',
    abbr: 'HSV',
    strength: 2,
    avatarColor: 'from-blue-600 to-black',
    fixtures: [
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, baseDifficulty: 5, date: '29.08.2026', mockOdds: { home: 1.35, draw: 5.00, away: 7.20 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: true, baseDifficulty: 3, date: '05.09.2026', mockOdds: { home: 2.60, draw: 3.30, away: 2.50 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, baseDifficulty: 5, date: '12.09.2026', mockOdds: { home: 1.30, draw: 5.00, away: 8.00 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 2.40, draw: 3.30, away: 2.75 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, baseDifficulty: 3, date: '10.10.2026', mockOdds: { home: 1.85, draw: 3.60, away: 3.75 } }
    ]
  },
  {
    name: 'FC Schalke 04',
    abbr: 'S04',
    strength: 2,
    avatarColor: 'from-blue-600 to-black',
    fixtures: [
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 2.10, draw: 3.30, away: 3.25 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, baseDifficulty: 5, date: '05.09.2026', mockOdds: { home: 6.20, draw: 5.10, away: 1.35 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '12.09.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.65 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 1.85, draw: 3.50, away: 4.00 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, baseDifficulty: 4, date: '10.10.2026', mockOdds: { home: 1.70, draw: 3.70, away: 4.50 } }
    ]
  },
  {
    name: 'SC Paderborn 07',
    abbr: 'SCP',
    strength: 2,
    avatarColor: 'from-blue-600 to-black',
    fixtures: [
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, baseDifficulty: 3, date: '29.08.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.60 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, baseDifficulty: 4, date: '05.09.2026', mockOdds: { home: 3.90, draw: 3.50, away: 1.88 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, baseDifficulty: 5, date: '12.09.2026', mockOdds: { home: 1.25, draw: 5.50, away: 9.00 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, baseDifficulty: 3, date: '19.09.2026', mockOdds: { home: 3.20, draw: 3.40, away: 2.10 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, baseDifficulty: 4, date: '10.10.2026', mockOdds: { home: 4.50, draw: 3.80, away: 1.68 } }
    ]
  },
  {
    name: 'SV Elversberg',
    abbr: 'SVE',
    strength: 2,
    avatarColor: 'from-gray-700 to-black',
    fixtures: [
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: true, baseDifficulty: 5, date: '29.08.2026', mockOdds: { home: 7.80, draw: 5.00, away: 1.30 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, baseDifficulty: 3, date: '05.09.2026', mockOdds: { home: 1.80, draw: 3.50, away: 4.20 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, baseDifficulty: 5, date: '12.09.2026', mockOdds: { home: 8.50, draw: 5.50, away: 1.25 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: false, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 1.85, draw: 3.50, away: 4.00 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '10.10.2026', mockOdds: { home: 1.80, draw: 3.50, away: 4.20 } }
    ]
  },
  {
    name: '1. FC Köln',
    abbr: 'KOE',
    strength: 2,
    avatarColor: 'from-red-500 to-white',
    fixtures: [
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, baseDifficulty: 3, date: '29.08.2026', mockOdds: { home: 2.65, draw: 3.40, away: 2.45 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: false, baseDifficulty: 4, date: '05.09.2026', mockOdds: { home: 1.60, draw: 3.90, away: 4.80 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, baseDifficulty: 3, date: '12.09.2026', mockOdds: { home: 2.30, draw: 3.40, away: 2.80 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 2.40, draw: 3.30, away: 2.75 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, baseDifficulty: 3, date: '10.10.2026', mockOdds: { home: 2.25, draw: 3.40, away: 2.95 } }
    ]
  }
];

export function FixturePlanner() {
  const [teams, setTeams] = useState<TeamData[]>(INITIAL_TEAMS);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Rotation analyzer states
  const [teamAIdx, setTeamAIdx] = useState<number>(0); // Default: Bayern
  const [teamBIdx, setTeamBIdx] = useState<number>(10); // Default: Union Berlin

  // Helper to map difficulty number to styled color badges (Apple / FPL standard)
  const getDifficultyColor = (fdr: number) => {
    switch (fdr) {
      case 1:
        return 'bg-successor-mint text-black font-black border border-successor-mint/30 shadow-[0_0_10px_rgba(0,255,136,0.15)]';
      case 2:
        return 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/20';
      case 3:
        return 'bg-white/[0.04] text-gray-400 border border-white/[0.06]';
      case 4:
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/20';
      case 5:
      default:
        return 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
    }
  };

  // Calculate FDR directly from the match odds (implied win probability)
  const calcFdr = (fixture: TeamFixture) => {
    const odds = fixture.isHome ? fixture.mockOdds.home : fixture.mockOdds.away;
    const winProb = 1 / odds;

    if (winProb >= 0.65) return 1; // Easiest (odds <= 1.54)
    if (winProb >= 0.48) return 2; // Easy (1.54 < odds <= 2.08)
    if (winProb >= 0.32) return 3; // Medium (2.08 < odds <= 3.12)
    if (winProb >= 0.18) return 4; // Hard (3.12 < odds <= 5.55)
    return 5; // Very Hard (odds > 5.55)
  };

  // Calculate average difficulty run for next 5 matches
  const getAverageFdr = (team: TeamData) => {
    const sum = team.fixtures.reduce((total, fix) => total + calcFdr(fix), 0);
    return (sum / team.fixtures.length).toFixed(1);
  };

  // Identify easiest and hardest schedules
  const sortedTeamsByAvgFdr = [...teams].sort((a, b) => {
    return Number(getAverageFdr(a)) - Number(getAverageFdr(b));
  });

  const easiestTeams = sortedTeamsByAvgFdr.slice(0, 3);
  const hardestTeams = sortedTeamsByAvgFdr.slice(-3).reverse();

  // Goalie Rotation Compatibility score calculation
  const calculateRotationScore = (tA: TeamData, tB: TeamData) => {
    let perfectRotations = 0;
    for (let i = 0; i < 5; i++) {
      const fdrA = calcFdr(tA.fixtures[i]);
      const fdrB = calcFdr(tB.fixtures[i]);

      // Perfect rotation condition:
      // When one has a hard fixture (FDR >= 4) AND the other has an easy home fixture (FDR <= 2)
      const hasPerfectA = fdrA >= 4 && fdrB <= 2 && tB.fixtures[i].isHome;
      const hasPerfectB = fdrB >= 4 && fdrA <= 2 && tA.fixtures[i].isHome;
      // Or both have average home/easy fixtures
      const bothHomeEasy = fdrA <= 3 && fdrB <= 3 && (tA.fixtures[i].isHome || tB.fixtures[i].isHome);

      if (hasPerfectA || hasPerfectB || bothHomeEasy) {
        perfectRotations++;
      }
    }
    // Convert to percentage
    return Math.round((perfectRotations / 5) * 100);
  };

  const rotScore = calculateRotationScore(teams[teamAIdx], teams[teamBIdx]);

  // Simulate syncing live odds from NeoBet Match API
  const handleSyncOdds = () => {
    setSyncing(true);
    setSyncSuccess(false);

    setTimeout(() => {
      // Slightly alter the match win odds based on simulated bookmaker shifts
      const updated = teams.map(team => {
        const updatedFixtures = team.fixtures.map(fix => {
          // Win odds shifts
          const oddsShift = (Math.random() * 0.4 - 0.2) * (fix.isHome ? fix.mockOdds.home : fix.mockOdds.away);
          const currentWinOdds = fix.isHome ? fix.mockOdds.home : fix.mockOdds.away;
          const newWinOdds = Math.max(1.1, currentWinOdds + oddsShift);

          const mockOdds = {
            home: fix.isHome ? Number(newWinOdds.toFixed(2)) : Number((newWinOdds * 2.5).toFixed(2)),
            draw: Number((2.8 + Math.random() * 1.5).toFixed(2)),
            away: fix.isHome ? Number((newWinOdds * 2.5).toFixed(2)) : Number(newWinOdds.toFixed(2))
          };

          return {
            ...fix,
            mockOdds
          };
        });

        return { ...team, fixtures: updatedFixtures };
      });

      setTeams(updated);
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">FDR &amp; Fixture-Planer</h1>
          <p className="text-xs text-successor-textMuted font-mono">Fixture Difficulty Rating &amp; Goalie Rotation Optimizer</p>
        </div>

        {/* Sync Live Odds from NeoBet */}
        <button
          onClick={handleSyncOdds}
          disabled={syncing}
          className="btn-secondary px-4 py-2 flex items-center gap-2"
        >
          {syncing ? (
            <RefreshCw size={12} className="animate-spin text-successor-mint" />
          ) : syncSuccess ? (
            <Check size={12} className="text-successor-mint" />
          ) : (
            <RefreshCw size={12} className="text-gray-400" />
          )}
          <span className="text-[11px] font-bold font-mono">
            {syncing ? 'Quoten abfragen...' : syncSuccess ? 'Quoten synchronisiert!' : 'NEO.bet Live-Odds laden'}
          </span>
        </button>
      </div>

      {/* TOP SUMMARY CARDS (Easiest / Hardest Runs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Easiest Runs */}
        <div className="glass-card rounded-2xl p-5 border-l-2 border-l-successor-mint">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles size={14} className="text-successor-mint" />
              Bester Spielplan (Sptg. 1-5)
            </h2>
            <span className="text-[9px] font-mono text-successor-mint bg-successor-mint/10 px-1.5 py-0.5 rounded-md">Grüner Run</span>
          </div>
          <div className="space-y-2">
            {easiestTeams.map((team, idx) => (
              <div key={team.abbr} className="flex justify-between items-center text-xs py-1 border-b border-white/[0.02] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-gray-500">#{idx + 1}</span>
                  <span className="font-bold text-white">{team.name}</span>
                </div>
                <span className="font-mono font-bold text-successor-mint">{getAverageFdr(team)} Avg FDR</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Hardest Runs */}
        <div className="glass-card rounded-2xl p-5 border-l-2 border-l-red-500">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp size={14} className="text-red-500" />
              Schwerster Spielplan (Sptg. 1-5)
            </h2>
            <span className="text-[9px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md">Achtung</span>
          </div>
          <div className="space-y-2">
            {hardestTeams.map((team, idx) => (
              <div key={team.abbr} className="flex justify-between items-center text-xs py-1 border-b border-white/[0.02] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-gray-500">#{idx + 1}</span>
                  <span className="font-bold text-white">{team.name}</span>
                </div>
                <span className="font-mono font-bold text-red-400">{getAverageFdr(team)} Avg FDR</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROTATION PLANNER COMPONENT */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Sliders size={16} className="text-successor-mint" />
            Torhüter- &amp; Roster-Rotationsplaner
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-successor-textMuted uppercase">Kombinations-Score</span>
            <div className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono ${rotScore >= 80 ? 'bg-successor-mint/10 text-successor-mint' : rotScore >= 50 ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'}`}>
              {rotScore}% Match
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Selectors */}
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Spieler / Team A</label>
              <select
                value={teamAIdx}
                onChange={e => setTeamAIdx(Number(e.target.value))}
                className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white focus:border-successor-mint/50 focus:outline-none transition-all"
              >
                {teams.map((t, idx) => (
                  <option key={t.abbr} value={idx}>{t.name} (FDR: {getAverageFdr(t)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Spieler / Team B</label>
              <select
                value={teamBIdx}
                onChange={e => setTeamBIdx(Number(e.target.value))}
                className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white focus:border-successor-mint/50 focus:outline-none transition-all"
              >
                {teams.map((t, idx) => (
                  <option key={t.abbr} value={idx}>{t.name} (FDR: {getAverageFdr(t)})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rotation visual side by side */}
          <div className="p-4 bg-[#0d0e10]/50 border border-white/[0.04] rounded-xl flex flex-col justify-between space-y-3">
            <div className="text-[10px] font-mono text-successor-textMuted uppercase">Rotation für Spieltag 1-5:</div>
            
            <div className="flex justify-between items-center">
              {/* Display fixtures */}
              {Array.from({ length: 5 }).map((_, idx) => {
                const fixA = teams[teamAIdx].fixtures[idx];
                const fixB = teams[teamBIdx].fixtures[idx];
                const fdrA = calcFdr(fixA);
                const fdrB = calcFdr(fixB);
                
                // Which player should we start? (Choose the lowest FDR)
                const startA = fdrA <= fdrB;

                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className="text-[8px] font-mono font-bold text-gray-500 uppercase">GW {idx + 1}</span>
                    <div className="flex flex-col gap-1">
                      {/* Team A dot */}
                      <div className={`w-8 py-1 rounded text-center text-[8.5px] font-black uppercase ${getDifficultyColor(fdrA)} ${startA ? 'ring-2 ring-white/50' : 'opacity-40'}`} title={`${teams[teamAIdx].name} gegen ${fixA.opponent}`}>
                        {fixA.opponentAbbr}
                      </div>
                      {/* Team B dot */}
                      <div className={`w-8 py-1 rounded text-center text-[8.5px] font-black uppercase ${getDifficultyColor(fdrB)} ${!startA ? 'ring-2 ring-white/50' : 'opacity-40'}`} title={`${teams[teamBIdx].name} gegen ${fixB.opponent}`}>
                        {fixB.opponentAbbr}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[9px] font-mono text-successor-textMuted">
              {rotScore >= 80 
                ? '💡 Tipp: Diese beiden Spieler rotieren exzellent! Du hast an fast jedem Spieltag eine grüne/einfache Partie auf dieser Position.'
                : '⚠️ Hinweis: Zu viele Spieltage, an denen beide Spieler schwere Partien gleichzeitig haben. Wähle eine andere Rotation.'}
            </div>
          </div>
        </div>
      </div>

      {/* FULL FDR GRID TABLE */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.04]">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Spielplan-Stärke (FDR-Matrix)</h2>
            <span className="text-[10px] text-successor-textMuted font-mono">FDR berechnet direkt aus implizierten NEO.bet Match-Siegquoten</span>
          </div>
          
          <div className="flex gap-2.5 items-center text-[9px] font-mono text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-successor-mint rounded-sm"></span> 1-2 (Einfach)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white/[0.05] border border-white/[0.06] rounded-sm"></span> 3 (Neutral)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500/10 border border-red-500/20 rounded-sm"></span> 4-5 (Schwer)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0d0e10]/40 text-[9px] uppercase tracking-[0.15em] font-mono text-successor-textMuted">
                <th className="py-4 px-5">Team</th>
                <th className="py-4 px-4 text-center">Avg FDR</th>
                {Array.from({ length: 5 }).map((_, i) => (
                  <th key={i} className="py-4 px-3 text-center">Spieltag {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {teams.map((team) => {
                const avgFdr = getAverageFdr(team);
                return (
                  <tr key={team.name} className="hover:bg-white/[0.01] transition-colors">
                    {/* Team Name */}
                    <td className="py-3 px-5 flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${team.avatarColor} opacity-70 border border-white/5 flex items-center justify-center font-bold text-[10px] uppercase text-white`}>
                        {team.abbr}
                      </div>
                      <span className="text-xs font-bold text-white whitespace-nowrap">{team.name}</span>
                    </td>

                    {/* Average FDR */}
                    <td className="py-3 px-4 text-center font-mono font-black text-xs text-white">
                      {avgFdr}
                    </td>

                    {/* GW 1 to 5 Fixtures */}
                    {team.fixtures.map((fixture, fIdx) => {
                      const fdr = calcFdr(fixture);
                      const impliedProb = Math.round((1 / (fixture.isHome ? fixture.mockOdds.home : fixture.mockOdds.away)) * 100);

                      return (
                        <td key={fIdx} className="py-3 px-2">
                          <div className="relative group/cell flex flex-col items-center">
                            {/* Fixture Cell */}
                            <div className={`w-14 py-2 rounded-lg text-center text-[10px] font-black uppercase transition-all ${getDifficultyColor(fdr)}`}>
                              {fixture.opponentAbbr}
                              <span className="text-[8px] font-normal lowercase block">
                                {fixture.isHome ? 'h' : 'a'}
                              </span>
                            </div>

                            {/* HOVER TOOLTIP (NeoBet API Odds info) */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-[#121316] border border-white/[0.08] rounded-xl p-3 shadow-2xl z-40 opacity-0 pointer-events-none group-hover/cell:opacity-100 transition-opacity duration-200">
                              <div className="text-[9px] font-black text-successor-mint uppercase tracking-wider mb-1.5 border-b border-white/[0.04] pb-1">
                                Match Details
                              </div>
                              <div className="space-y-1 font-mono text-[9px] text-gray-300">
                                <div className="flex justify-between">
                                  <span>Gegner:</span>
                                  <span className="text-white font-bold">{fixture.opponent}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Spielort:</span>
                                  <span className="text-white font-bold">{fixture.isHome ? 'Heimspiel' : 'Auswärtsspiel'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Termin:</span>
                                  <span className="text-white font-bold">{fixture.date}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Win Probability:</span>
                                  <span className="text-successor-mint font-bold">{impliedProb}%</span>
                                </div>
                                <div className="mt-1.5 pt-1.5 border-t border-white/[0.04] flex justify-between font-bold text-[8.5px]">
                                  <span>NEO.bet Odds:</span>
                                  <span className="text-white">
                                    {fixture.mockOdds.home} - {fixture.mockOdds.draw} - {fixture.mockOdds.away}
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
