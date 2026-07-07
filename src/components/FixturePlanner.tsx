import { useState, useEffect } from 'react';
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
  strength: number; // calculated season strength 1-5
  rank: number; // derived power rank 1-18
  avatarColor: string;
  fixtures: TeamFixture[];
}

// Local club logo asset mappings copied from Desktop
const TEAM_LOGOS: Record<string, string> = {
  'FCB': '/logos/256x256/bayern-munchen.football-logos.cc.png',
  'B04': '/logos/256x256/bayer-leverkusen.football-logos.cc.png',
  'BVB': '/logos/256x256/borussia-dortmund.football-logos.cc.png',
  'RBL': '/logos/256x256/rb-leipzig.football-logos.cc.png',
  'VFB': '/logos/256x256/vfb-stuttgart.football-logos.cc.png',
  'SGE': '/logos/256x256/eintracht-frankfurt.football-logos.cc.png',
  'SCF': '/logos/256x256/freiburg.football-logos.cc.png',
  'TSG': '/logos/256x256/hoffenheim.football-logos.cc.png',
  'SVW': '/logos/256x256/werder-bremen.football-logos.cc.png',
  'BMG': '/logos/256x256/borussia-monchengladbach.football-logos.cc.png',
  'FCU': '/logos/256x256/union-berlin.football-logos.cc.png',
  'FCA': '/logos/256x256/augsburg.football-logos.cc.png',
  'M05': '/logos/256x256/mainz-05.football-logos.cc.png',
  'HSV': '/logos/256x256/hamburger-sv.football-logos.cc.png',
  'S04': '/logos/256x256/schalke-04.football-logos.cc.png',
  'SCP': '/logos/256x256/paderborn.football-logos.cc.png',
  'SVE': '/logos/256x256/sv-elversberg.football-logos.cc.png',
  'KOE': '/logos/256x256/koln.football-logos.cc.png'
};

const BUNDESLIGA_LOGO = '/logos/bundesliga.svg';

// Bundesliga Schedule for Spieltage 1 to 10
const INITIAL_TEAMS: TeamData[] = [
  {
    name: 'FC Bayern München',
    abbr: 'FCB',
    strength: 5,
    rank: 1,
    avatarColor: 'from-red-600 to-red-950',
    fixtures: [
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, baseDifficulty: 4, date: '28.08.2026', mockOdds: { home: 1.45, draw: 4.80, away: 5.80 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: false, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 6.20, draw: 5.10, away: 1.35 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 8.50, draw: 5.50, away: 1.25 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: true, baseDifficulty: 3, date: '19.09.2026', mockOdds: { home: 1.30, draw: 5.25, away: 8.00 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 5.50, draw: 4.20, away: 1.48 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, baseDifficulty: 5, date: '17.10.2026', mockOdds: { home: 1.85, draw: 3.80, away: 3.90 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, baseDifficulty: 4, date: '24.10.2026', mockOdds: { home: 4.20, draw: 3.75, away: 1.78 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, baseDifficulty: 5, date: '31.10.2026', mockOdds: { home: 1.80, draw: 3.90, away: 4.00 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, baseDifficulty: 3, date: '07.11.2026', mockOdds: { home: 5.00, draw: 4.00, away: 1.58 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, baseDifficulty: 2, date: '21.11.2026', mockOdds: { home: 1.25, draw: 5.80, away: 11.00 } }
    ]
  },
  {
    name: 'Bayer 04 Leverkusen',
    abbr: 'B04',
    strength: 5,
    rank: 2,
    avatarColor: 'from-red-600 to-black',
    fixtures: [
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 7.80, draw: 5.00, away: 1.30 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: true, baseDifficulty: 3, date: '05.09.2026', mockOdds: { home: 1.40, draw: 4.50, away: 6.50 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 5.80, draw: 4.00, away: 1.45 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, baseDifficulty: 5, date: '19.09.2026', mockOdds: { home: 2.15, draw: 3.40, away: 3.10 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, baseDifficulty: 3, date: '10.10.2026', mockOdds: { home: 4.50, draw: 3.80, away: 1.65 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, baseDifficulty: 4, date: '17.10.2026', mockOdds: { home: 1.60, draw: 3.90, away: 5.25 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, baseDifficulty: 3, date: '24.10.2026', mockOdds: { home: 3.90, draw: 3.70, away: 1.85 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, baseDifficulty: 4, date: '31.10.2026', mockOdds: { home: 1.70, draw: 3.90, away: 4.50 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: false, baseDifficulty: 2, date: '07.11.2026', mockOdds: { home: 6.00, draw: 4.20, away: 1.50 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, baseDifficulty: 2, date: '21.11.2026', mockOdds: { home: 1.28, draw: 5.50, away: 10.00 } }
    ]
  },
  {
    name: 'Borussia Dortmund',
    abbr: 'BVB',
    strength: 5,
    rank: 3,
    avatarColor: 'from-yellow-500 to-black',
    fixtures: [
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 1.35, draw: 5.00, away: 7.20 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, baseDifficulty: 3, date: '05.09.2026', mockOdds: { home: 3.80, draw: 3.65, away: 1.85 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 1.25, draw: 5.50, away: 9.00 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '19.09.2026', mockOdds: { home: 4.20, draw: 3.60, away: 1.75 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, baseDifficulty: 3, date: '10.10.2026', mockOdds: { home: 1.50, draw: 4.20, away: 5.50 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '17.10.2026', mockOdds: { home: 4.00, draw: 3.60, away: 1.85 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, baseDifficulty: 4, date: '24.10.2026', mockOdds: { home: 1.70, draw: 3.85, away: 4.50 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, baseDifficulty: 5, date: '31.10.2026', mockOdds: { home: 1.80, draw: 3.90, away: 4.00 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, baseDifficulty: 2, date: '07.11.2026', mockOdds: { home: 1.30, draw: 5.25, away: 8.50 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, baseDifficulty: 3, date: '21.11.2026', mockOdds: { home: 3.60, draw: 3.50, away: 1.95 } }
    ]
  },
  {
    name: 'RB Leipzig',
    abbr: 'RBL',
    strength: 5,
    rank: 4,
    avatarColor: 'from-blue-600 to-red-600',
    fixtures: [
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, baseDifficulty: 3, date: '29.08.2026', mockOdds: { home: 1.55, draw: 4.00, away: 5.00 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, baseDifficulty: 3, date: '05.09.2026', mockOdds: { home: 4.20, draw: 3.80, away: 1.70 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 1.30, draw: 5.00, away: 8.00 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, baseDifficulty: 5, date: '19.09.2026', mockOdds: { home: 2.15, draw: 3.40, away: 3.10 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, baseDifficulty: 4, date: '10.10.2026', mockOdds: { home: 1.65, draw: 3.90, away: 4.50 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, baseDifficulty: 5, date: '17.10.2026', mockOdds: { home: 1.85, draw: 3.80, away: 3.90 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, baseDifficulty: 2, date: '24.10.2026', mockOdds: { home: 1.28, draw: 5.50, away: 9.50 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: false, baseDifficulty: 2, date: '31.10.2026', mockOdds: { home: 5.80, draw: 4.00, away: 1.48 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: true, baseDifficulty: 2, date: '07.11.2026', mockOdds: { home: 1.40, draw: 4.50, away: 6.80 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '21.11.2026', mockOdds: { home: 3.80, draw: 3.50, away: 1.90 } }
    ]
  },
  {
    name: 'VfB Stuttgart',
    abbr: 'VFB',
    strength: 4,
    rank: 5,
    avatarColor: 'from-red-500 to-white',
    fixtures: [
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, baseDifficulty: 5, date: '28.08.2026', mockOdds: { home: 1.45, draw: 4.80, away: 5.80 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 1.60, draw: 3.90, away: 4.80 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, baseDifficulty: 3, date: '12.09.2026', mockOdds: { home: 3.40, draw: 3.50, away: 2.05 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, baseDifficulty: 5, date: '19.09.2026', mockOdds: { home: 2.45, draw: 3.50, away: 2.60 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 4.50, draw: 3.80, away: 1.68 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, baseDifficulty: 2, date: '17.10.2026', mockOdds: { home: 3.80, draw: 3.50, away: 1.90 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, baseDifficulty: 3, date: '24.10.2026', mockOdds: { home: 1.75, draw: 3.70, away: 4.20 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, baseDifficulty: 5, date: '31.10.2026', mockOdds: { home: 1.70, draw: 3.90, away: 4.50 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, baseDifficulty: 3, date: '07.11.2026', mockOdds: { home: 1.80, draw: 3.60, away: 4.00 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: false, baseDifficulty: 2, date: '21.11.2026', mockOdds: { home: 4.20, draw: 3.60, away: 1.80 } }
    ]
  },
  {
    name: 'Eintracht Frankfurt',
    abbr: 'SGE',
    strength: 4,
    rank: 6,
    avatarColor: 'from-black to-red-600',
    fixtures: [
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '29.08.2026', mockOdds: { home: 2.70, draw: 3.30, away: 2.45 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: true, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 1.65, draw: 3.80, away: 4.50 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, baseDifficulty: 3, date: '12.09.2026', mockOdds: { home: 3.10, draw: 3.30, away: 2.20 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, baseDifficulty: 4, date: '19.09.2026', mockOdds: { home: 2.10, draw: 3.40, away: 3.25 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, baseDifficulty: 5, date: '10.10.2026', mockOdds: { home: 1.65, draw: 3.90, away: 4.50 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, baseDifficulty: 2, date: '17.10.2026', mockOdds: { home: 1.70, draw: 3.75, away: 4.50 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, baseDifficulty: 5, date: '24.10.2026', mockOdds: { home: 1.70, draw: 3.85, away: 4.50 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, baseDifficulty: 2, date: '31.10.2026', mockOdds: { home: 1.80, draw: 3.60, away: 4.20 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, baseDifficulty: 2, date: '07.11.2026', mockOdds: { home: 3.80, draw: 3.50, away: 1.95 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, baseDifficulty: 3, date: '21.11.2026', mockOdds: { home: 2.05, draw: 3.40, away: 3.30 } }
    ]
  },
  {
    name: 'Sport-Club Freiburg',
    abbr: 'SCF',
    strength: 4,
    rank: 7,
    avatarColor: 'from-red-600 to-black',
    fixtures: [
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, baseDifficulty: 3, date: '29.08.2026', mockOdds: { home: 1.85, draw: 3.60, away: 3.80 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 3.90, draw: 3.50, away: 1.88 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, baseDifficulty: 3, date: '12.09.2026', mockOdds: { home: 2.00, draw: 3.40, away: 3.45 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, baseDifficulty: 4, date: '19.09.2026', mockOdds: { home: 2.10, draw: 3.40, away: 3.25 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 1.70, draw: 3.70, away: 4.50 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, baseDifficulty: 5, date: '17.10.2026', mockOdds: { home: 1.60, draw: 3.90, away: 5.25 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, baseDifficulty: 5, date: '24.10.2026', mockOdds: { home: 4.20, draw: 3.75, away: 1.78 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, baseDifficulty: 2, date: '31.10.2026', mockOdds: { home: 3.20, draw: 3.40, away: 2.15 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: true, baseDifficulty: 3, date: '07.11.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.65 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, baseDifficulty: 2, date: '21.11.2026', mockOdds: { home: 4.20, draw: 3.60, away: 1.85 } }
    ]
  },
  {
    name: 'TSG Hoffenheim',
    abbr: 'TSG',
    strength: 3,
    rank: 8,
    avatarColor: 'from-blue-600 to-blue-900',
    fixtures: [
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: false, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 2.65, draw: 3.40, away: 2.45 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, baseDifficulty: 5, date: '05.09.2026', mockOdds: { home: 3.80, draw: 3.65, away: 1.85 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, baseDifficulty: 4, date: '12.09.2026', mockOdds: { home: 3.40, draw: 3.50, away: 2.05 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 3.20, draw: 3.40, away: 2.10 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 1.85, draw: 3.60, away: 3.75 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, baseDifficulty: 3, date: '17.10.2026', mockOdds: { home: 2.75, draw: 3.30, away: 2.40 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: true, baseDifficulty: 5, date: '24.10.2026', mockOdds: { home: 3.90, draw: 3.70, away: 1.85 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, baseDifficulty: 3, date: '31.10.2026', mockOdds: { home: 2.30, draw: 3.45, away: 2.90 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, baseDifficulty: 2, date: '07.11.2026', mockOdds: { home: 1.80, draw: 3.55, away: 4.10 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, baseDifficulty: 4, date: '21.11.2026', mockOdds: { home: 2.05, draw: 3.40, away: 3.30 } }
    ]
  },
  {
    name: 'SV Werder Bremen',
    abbr: 'SVW',
    strength: 3,
    rank: 9,
    avatarColor: 'from-emerald-600 to-black',
    fixtures: [
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, baseDifficulty: 4, date: '29.08.2026', mockOdds: { home: 1.85, draw: 3.60, away: 3.80 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, baseDifficulty: 5, date: '05.09.2026', mockOdds: { home: 4.20, draw: 3.80, away: 1.70 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: false, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 2.30, draw: 3.40, away: 2.80 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: true, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 2.00, draw: 3.40, away: 3.50 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, baseDifficulty: 5, date: '10.10.2026', mockOdds: { home: 1.50, draw: 4.20, away: 5.50 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, baseDifficulty: 2, date: '17.10.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.60 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, baseDifficulty: 3, date: '24.10.2026', mockOdds: { home: 2.50, draw: 3.30, away: 2.65 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, baseDifficulty: 3, date: '31.10.2026', mockOdds: { home: 2.30, draw: 3.45, away: 2.90 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: false, baseDifficulty: 4, date: '07.11.2026', mockOdds: { home: 1.80, draw: 3.60, away: 4.00 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, baseDifficulty: 2, date: '21.11.2026', mockOdds: { home: 2.10, draw: 3.40, away: 3.25 } }
    ]
  },
  {
    name: 'Borussia Mönchengladbach',
    abbr: 'BMG',
    strength: 3,
    rank: 10,
    avatarColor: 'from-gray-500 to-black',
    fixtures: [
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, baseDifficulty: 5, date: '29.08.2026', mockOdds: { home: 1.55, draw: 4.00, away: 5.00 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 1.80, draw: 3.50, away: 4.20 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, baseDifficulty: 4, date: '12.09.2026', mockOdds: { home: 2.00, draw: 3.40, away: 3.45 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: true, baseDifficulty: 3, date: '19.09.2026', mockOdds: { home: 2.20, draw: 3.30, away: 3.10 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 2.80, draw: 3.30, away: 2.35 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, baseDifficulty: 3, date: '17.10.2026', mockOdds: { home: 2.75, draw: 3.30, away: 2.40 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: false, baseDifficulty: 4, date: '24.10.2026', mockOdds: { home: 1.75, draw: 3.70, away: 4.20 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, baseDifficulty: 2, date: '31.10.2026', mockOdds: { home: 1.85, draw: 3.50, away: 4.00 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, baseDifficulty: 2, date: '07.11.2026', mockOdds: { home: 1.90, draw: 3.40, away: 3.80 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, baseDifficulty: 5, date: '21.11.2026', mockOdds: { home: 3.60, draw: 3.50, away: 1.95 } }
    ]
  },
  {
    name: '1. FC Union Berlin',
    abbr: 'FCU',
    strength: 3,
    rank: 11,
    avatarColor: 'from-red-500 to-black',
    fixtures: [
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, baseDifficulty: 4, date: '29.08.2026', mockOdds: { home: 2.70, draw: 3.30, away: 2.45 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, baseDifficulty: 5, date: '05.09.2026', mockOdds: { home: 1.40, draw: 4.50, away: 6.50 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, baseDifficulty: 2, date: '12.09.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.65 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, baseDifficulty: 5, date: '19.09.2026', mockOdds: { home: 1.30, draw: 5.25, away: 8.00 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 1.80, draw: 3.50, away: 4.20 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, baseDifficulty: 5, date: '17.10.2026', mockOdds: { home: 4.00, draw: 3.60, away: 1.85 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, baseDifficulty: 2, date: '24.10.2026', mockOdds: { home: 2.10, draw: 3.35, away: 3.20 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, baseDifficulty: 2, date: '31.10.2026', mockOdds: { home: 2.05, draw: 3.30, away: 3.40 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, baseDifficulty: 4, date: '07.11.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.65 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, baseDifficulty: 5, date: '21.11.2026', mockOdds: { home: 3.80, draw: 3.50, away: 1.90 } }
    ]
  },
  {
    name: 'FC Augsburg',
    abbr: 'FCA',
    strength: 2,
    rank: 12,
    avatarColor: 'from-emerald-700 to-red-600',
    fixtures: [
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 2.10, draw: 3.30, away: 3.25 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, baseDifficulty: 4, date: '05.09.2026', mockOdds: { home: 1.65, draw: 3.80, away: 4.50 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: true, baseDifficulty: 5, date: '12.09.2026', mockOdds: { home: 5.80, draw: 4.00, away: 1.45 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, baseDifficulty: 3, date: '19.09.2026', mockOdds: { home: 2.00, draw: 3.40, away: 3.50 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, baseDifficulty: 5, date: '10.10.2026', mockOdds: { home: 5.50, draw: 4.20, away: 1.48 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, baseDifficulty: 2, date: '17.10.2026', mockOdds: { home: 2.65, draw: 3.30, away: 2.50 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: true, baseDifficulty: 3, date: '24.10.2026', mockOdds: { home: 2.10, draw: 3.35, away: 3.20 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, baseDifficulty: 4, date: '31.10.2026', mockOdds: { home: 3.20, draw: 3.40, away: 2.15 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, baseDifficulty: 5, date: '07.11.2026', mockOdds: { home: 1.40, draw: 4.50, away: 6.80 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: true, baseDifficulty: 3, date: '21.11.2026', mockOdds: { home: 2.15, draw: 3.30, away: 3.30 } }
    ]
  },
  {
    name: '1. FSV Mainz 05',
    abbr: 'M05',
    strength: 3,
    rank: 13,
    avatarColor: 'from-red-600 to-white',
    fixtures: [
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.60 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, baseDifficulty: 2, date: '05.09.2026', mockOdds: { home: 2.60, draw: 3.30, away: 2.50 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, baseDifficulty: 4, date: '12.09.2026', mockOdds: { home: 3.10, draw: 3.30, away: 2.20 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, baseDifficulty: 5, date: '19.09.2026', mockOdds: { home: 4.50, draw: 3.80, away: 1.65 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, baseDifficulty: 2, date: '10.10.2026', mockOdds: { home: 2.65, draw: 3.30, away: 2.45 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, baseDifficulty: 2, date: '17.10.2026', mockOdds: { home: 1.90, draw: 3.40, away: 3.80 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, baseDifficulty: 3, date: '24.10.2026', mockOdds: { home: 2.50, draw: 3.30, away: 2.65 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, baseDifficulty: 5, date: '07.11.2026', mockOdds: { home: 5.00, draw: 4.00, away: 1.58 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, baseDifficulty: 2, date: '21.11.2026', mockOdds: { home: 1.90, draw: 3.40, away: 3.80 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, baseDifficulty: 2, date: '21.11.2026', mockOdds: { home: 2.15, draw: 3.30, away: 3.30 } }
    ]
  },
  {
    name: 'Hamburger SV',
    abbr: 'HSV',
    strength: 2,
    rank: 14,
    avatarColor: 'from-blue-600 to-black',
    fixtures: [
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, baseDifficulty: 5, date: '29.08.2026', mockOdds: { home: 1.35, draw: 5.00, away: 7.20 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: true, baseDifficulty: 3, date: '05.09.2026', mockOdds: { home: 2.60, draw: 3.30, away: 2.50 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, baseDifficulty: 5, date: '12.09.2026', mockOdds: { home: 1.30, draw: 5.00, away: 8.00 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 2.40, draw: 3.30, away: 2.75 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, baseDifficulty: 3, date: '10.10.2026', mockOdds: { home: 1.85, draw: 3.60, away: 3.75 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, baseDifficulty: 4, date: '17.10.2026', mockOdds: { home: 3.80, draw: 3.50, away: 1.90 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, baseDifficulty: 3, date: '07.11.2026', mockOdds: { home: 1.90, draw: 3.40, away: 3.80 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, baseDifficulty: 4, date: '31.10.2026', mockOdds: { home: 1.80, draw: 3.60, away: 4.20 } },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, baseDifficulty: 2, date: '24.10.2026', mockOdds: { home: 2.20, draw: 3.35, away: 3.10 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, baseDifficulty: 3, date: '21.11.2026', mockOdds: { home: 2.10, draw: 3.40, away: 3.25 } }
    ]
  },
  {
    name: 'FC Schalke 04',
    abbr: 'S04',
    strength: 2,
    rank: 15,
    avatarColor: 'from-blue-600 to-black',
    fixtures: [
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, baseDifficulty: 2, date: '29.08.2026', mockOdds: { home: 2.10, draw: 3.30, away: 3.25 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, baseDifficulty: 5, date: '05.09.2026', mockOdds: { home: 6.20, draw: 5.10, away: 1.35 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '12.09.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.65 } },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 1.85, draw: 3.50, away: 4.00 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, baseDifficulty: 4, date: '10.10.2026', mockOdds: { home: 1.70, draw: 3.70, away: 4.50 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, baseDifficulty: 3, date: '17.10.2026', mockOdds: { home: 1.90, draw: 3.40, away: 3.80 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, baseDifficulty: 5, date: '31.10.2026', mockOdds: { home: 5.80, draw: 4.00, away: 1.48 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, baseDifficulty: 3, date: '07.11.2026', mockOdds: { home: 1.80, draw: 3.55, away: 4.10 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, baseDifficulty: 4, date: '21.11.2026', mockOdds: { home: 4.20, draw: 3.60, away: 1.80 } },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: false, baseDifficulty: 2, date: '21.11.2026', mockOdds: { home: 2.50, draw: 3.30, away: 2.65 } }
    ]
  },
  {
    name: 'SC Paderborn 07',
    abbr: 'SCP',
    strength: 2,
    rank: 16,
    avatarColor: 'from-blue-600 to-black',
    fixtures: [
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, baseDifficulty: 3, date: '29.08.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.60 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, baseDifficulty: 4, date: '05.09.2026', mockOdds: { home: 3.90, draw: 3.50, away: 1.88 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, baseDifficulty: 5, date: '12.09.2026', mockOdds: { home: 1.25, draw: 5.50, away: 9.00 } },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, baseDifficulty: 3, date: '19.09.2026', mockOdds: { home: 3.20, draw: 3.40, away: 2.10 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, baseDifficulty: 4, date: '10.10.2026', mockOdds: { home: 4.50, draw: 3.80, away: 1.68 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, baseDifficulty: 3, date: '17.10.2026', mockOdds: { home: 1.95, draw: 3.40, away: 3.60 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, baseDifficulty: 2, date: '24.10.2026', mockOdds: { home: 2.20, draw: 3.35, away: 3.10 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, baseDifficulty: 3, date: '31.10.2026', mockOdds: { home: 1.85, draw: 3.50, away: 4.00 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, baseDifficulty: 4, date: '07.11.2026', mockOdds: { home: 3.80, draw: 3.50, away: 1.95 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, baseDifficulty: 5, date: '21.11.2026', mockOdds: { home: 1.28, draw: 5.50, away: 10.00 } }
    ]
  },
  {
    name: 'SV Elversberg',
    abbr: 'SVE',
    strength: 2,
    rank: 17,
    avatarColor: 'from-gray-700 to-black',
    fixtures: [
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: true, baseDifficulty: 5, date: '29.08.2026', mockOdds: { home: 7.80, draw: 5.00, away: 1.30 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, baseDifficulty: 3, date: '05.09.2026', mockOdds: { home: 1.80, draw: 3.50, away: 4.20 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, baseDifficulty: 5, date: '12.09.2026', mockOdds: { home: 8.50, draw: 5.50, away: 1.25 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: false, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 1.85, draw: 3.50, away: 4.00 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '10.10.2026', mockOdds: { home: 1.80, draw: 3.50, away: 4.20 } },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: true, baseDifficulty: 2, date: '17.10.2026', mockOdds: { home: 2.65, draw: 3.30, away: 2.50 } },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, baseDifficulty: 5, date: '24.10.2026', mockOdds: { home: 1.28, draw: 5.50, away: 9.50 } },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: true, baseDifficulty: 3, date: '21.11.2026', mockOdds: { home: 1.90, draw: 3.40, away: 3.80 } },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, baseDifficulty: 5, date: '07.11.2026', mockOdds: { home: 1.30, draw: 5.25, away: 8.50 } },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, baseDifficulty: 4, date: '21.11.2026', mockOdds: { home: 4.20, draw: 3.60, away: 1.85 } }
    ]
  },
  {
    name: '1. FC Köln',
    abbr: 'KOE',
    strength: 2,
    rank: 18,
    avatarColor: 'from-red-500 to-white',
    fixtures: [
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, baseDifficulty: 3, date: '29.08.2026', mockOdds: { home: 2.65, draw: 3.40, away: 2.45 } },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: false, baseDifficulty: 4, date: '05.09.2026', mockOdds: { home: 1.60, draw: 3.90, away: 4.80 } },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, baseDifficulty: 3, date: '12.09.2026', mockOdds: { home: 2.30, draw: 3.40, away: 2.80 } },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, baseDifficulty: 2, date: '19.09.2026', mockOdds: { home: 2.40, draw: 3.30, away: 2.75 } },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, baseDifficulty: 3, date: '10.10.2026', mockOdds: { home: 2.25, draw: 3.40, away: 2.95 } },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, baseDifficulty: 4, date: '17.10.2026', mockOdds: { home: 1.70, draw: 3.75, away: 4.50 } },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: true, baseDifficulty: 5, date: '07.11.2026', mockOdds: { home: 6.00, draw: 4.20, away: 1.50 } },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, baseDifficulty: 3, date: '31.10.2026', mockOdds: { home: 2.05, draw: 3.30, away: 3.40 } },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, baseDifficulty: 2, date: '21.11.2026', mockOdds: { home: 2.50, draw: 3.30, away: 2.65 } },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, baseDifficulty: 5, date: '21.11.2026', mockOdds: { home: 1.25, draw: 5.80, away: 11.00 } }
    ]
  }
];

export function FixturePlanner() {
  const [teams, setTeams] = useState<TeamData[]>(INITIAL_TEAMS);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Active club dashboard selector state
  const [selectedTeamIdx, setSelectedTeamIdx] = useState<number>(0); // Default: Bayern
  const [gwRange, setGwRange] = useState<'1-5' | '6-10'>('1-5');

  // Rotation planner states
  const [teamAIdx, setTeamAIdx] = useState<number>(0); // Default: Bayern
  const [teamBIdx, setTeamBIdx] = useState<number>(10); // Default: Union Berlin

  // Season-long power ratings dynamically derived from gw 1 & 2 odds
  const [derivedStrengths, setDerivedStrengths] = useState<Record<string, number>>({});

  const calculateSeasonStrengths = (activeTeams: TeamData[]) => {
    const rawScores: Record<string, number> = {};

    activeTeams.forEach(team => {
      const gw1 = team.fixtures[0];
      const gw2 = team.fixtures[1];

      // Normalize home/away bias (Away win odds are divided by 1.4 for parity)
      const odds1 = gw1.isHome ? gw1.mockOdds.home : gw1.mockOdds.away / 1.4;
      const odds2 = gw2.isHome ? gw2.mockOdds.home : gw2.mockOdds.away / 1.4;

      const prob1 = 1 / odds1;
      const prob2 = 1 / odds2;
      const avgProb = (prob1 + prob2) / 2;

      rawScores[team.abbr] = avgProb;
    });

    const sortedAbbrs = Object.keys(rawScores).sort((a, b) => rawScores[b] - rawScores[a]);

    const computedStrengths: Record<string, number> = {};
    sortedAbbrs.forEach((abbr, idx) => {
      const rank = idx + 1;
      let strength = 3;
      if (rank <= 4) strength = 5;
      else if (rank <= 8) strength = 4;
      else if (rank <= 13) strength = 3;
      else strength = 2;

      computedStrengths[abbr] = strength;
    });

    setDerivedStrengths(computedStrengths);

    setTeams(prev => prev.map(t => {
      const rankIndex = sortedAbbrs.indexOf(t.abbr);
      return {
        ...t,
        rank: rankIndex !== -1 ? rankIndex + 1 : t.rank,
        strength: computedStrengths[t.abbr] || t.strength
      };
    }));
  };

  useEffect(() => {
    calculateSeasonStrengths(teams);
  }, []);

  // Compute FDR based on derived opponent strength
  const calcFdr = (fixture: TeamFixture) => {
    const opponentStrength = derivedStrengths[fixture.opponentAbbr] || fixture.baseDifficulty;
    const rawFdr = opponentStrength + (fixture.isHome ? -0.5 : 0.5);
    return Math.max(1, Math.min(5, Math.round(rawFdr)));
  };

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



  const getAverageFdr = (team: TeamData) => {
    const targetFixtures = gwRange === '1-5' ? team.fixtures.slice(0, 5) : team.fixtures.slice(5, 10);
    const sum = targetFixtures.reduce((total, fix) => total + calcFdr(fix), 0);
    return (sum / targetFixtures.length).toFixed(1);
  };

  const sortedTeamsByAvgFdr = [...teams].sort((a, b) => {
    return Number(getAverageFdr(a)) - Number(getAverageFdr(b));
  });

  const easiestTeams = sortedTeamsByAvgFdr.slice(0, 3);
  const hardestTeams = sortedTeamsByAvgFdr.slice(-3).reverse();

  const calculateRotationScore = (tA: TeamData, tB: TeamData) => {
    let perfectRotations = 0;
    const startIndex = gwRange === '1-5' ? 0 : 5;
    
    for (let i = startIndex; i < startIndex + 5; i++) {
      const fdrA = calcFdr(tA.fixtures[i]);
      const fdrB = calcFdr(tB.fixtures[i]);

      const hasPerfectA = fdrA >= 4 && fdrB <= 2 && tB.fixtures[i].isHome;
      const hasPerfectB = fdrB >= 4 && fdrA <= 2 && tA.fixtures[i].isHome;
      const bothHomeEasy = fdrA <= 3 && fdrB <= 3 && (tA.fixtures[i].isHome || tB.fixtures[i].isHome);

      if (hasPerfectA || hasPerfectB || bothHomeEasy) {
        perfectRotations++;
      }
    }
    return Math.round((perfectRotations / 5) * 100);
  };

  const rotScore = calculateRotationScore(teams[teamAIdx], teams[teamBIdx]);

  const handleSyncOdds = () => {
    setSyncing(true);
    setSyncSuccess(false);

    setTimeout(() => {
      const updated = teams.map(team => {
        const updatedFixtures = team.fixtures.map(fix => {
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
      calculateSeasonStrengths(updated);
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  const activeTeam = teams[selectedTeamIdx];
  const activeFixtures = gwRange === '1-5' ? activeTeam.fixtures.slice(0, 5) : activeTeam.fixtures.slice(5, 10);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <img src={BUNDESLIGA_LOGO} alt="Bundesliga Logo" className="h-9 w-9 object-contain opacity-90" />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white">FDR &amp; Fixture-Planer</h1>
            <p className="text-xs text-successor-textMuted font-mono">Fixture Difficulty Rating &amp; Goalie Rotation Optimizer</p>
          </div>
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

      {/* PAGER / RANGE SELECTOR */}
      <div className="flex justify-between items-center bg-[#13151a] p-1.5 border border-white/[0.04] rounded-2xl">
        <span className="text-[10px] font-black uppercase text-successor-textMuted px-3 font-mono">Spieltage auswählen</span>
        
        <div className="flex gap-1">
          <button
            onClick={() => setGwRange('1-5')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${gwRange === '1-5' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Spieltage 1 - 5
          </button>
          <button
            onClick={() => setGwRange('6-10')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${gwRange === '6-10' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Spieltage 6 - 10
          </button>
        </div>
      </div>

      {/* DEDICATED CLUB SELECTOR & RUN DASHBOARD (MODAL STYLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CLUB SELECTOR DASHBOARD (Primary Tool) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-white/[0.05] pb-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-white">Club-Spielplan-Check</h2>
                <p className="text-[10px] text-successor-textMuted font-mono">Filtere nach Verein, um die genaue FDR-Kurve einzusehen</p>
              </div>

              {/* Selector Dropdown */}
              <div className="relative flex items-center">
                <img src={TEAM_LOGOS[activeTeam.abbr]} alt="" className="absolute left-3 w-5 h-5 object-contain pointer-events-none" />
                <select
                  value={selectedTeamIdx}
                  onChange={e => setSelectedTeamIdx(Number(e.target.value))}
                  className="bg-[#0d0e10] border border-white/[0.06] rounded-xl py-2 pl-10 pr-8 text-xs font-black text-white focus:border-successor-mint/45 focus:outline-none cursor-pointer"
                >
                  {teams.map((t, idx) => (
                    <option key={t.abbr} value={idx}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Club Metrics */}
            <div className="flex items-center gap-4 bg-[#0d0e10]/40 border border-white/[0.04] p-4 rounded-2xl">
              <img src={TEAM_LOGOS[activeTeam.abbr]} alt="" className="w-11 h-11 object-contain" />
              <div>
                <div className="text-sm font-black text-white">{activeTeam.name}</div>
                <div className="flex items-center gap-3 mt-1.5 text-[9.5px] font-mono text-successor-textMuted uppercase">
                  <span>Power Rank: <strong className="text-white">#{activeTeam.rank}</strong></span>
                  <span>•</span>
                  <span>Schnitt (Sptg. {gwRange}): <strong className="text-successor-mint">{getAverageFdr(activeTeam)} FDR</strong></span>
                </div>
              </div>
            </div>

            {/* Visual Fixture Timeline (Revolut Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 pt-2">
              {activeFixtures.map((fixture, index) => {
                const fIdx = gwRange === '1-5' ? index : index + 5;
                const fdr = calcFdr(fixture);
                const impliedProb = Math.round((1 / (fixture.isHome ? fixture.mockOdds.home : fixture.mockOdds.away)) * 100);

                return (
                  <div key={index} className="bg-[#0d0e10]/60 border border-white/[0.04] p-3 rounded-2xl flex flex-col justify-between h-32 relative group/timeline hover:border-white/10 transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-mono font-bold text-gray-500 uppercase">GW {fIdx + 1}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black font-mono uppercase ${getDifficultyColor(fdr)}`}>
                        FDR {fdr}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 my-2">
                      <img src={TEAM_LOGOS[fixture.opponentAbbr]} alt="" className="w-5.5 h-5.5 object-contain" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-black text-white truncate">{fixture.opponentAbbr}</div>
                        <span className="text-[8px] font-mono text-successor-textMuted block lowercase">
                          {fixture.isHome ? 'Heimspiel' : 'Auswärts'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-gray-500 border-t border-white/[0.03] pt-1.5 flex justify-between">
                      <span>Chance:</span>
                      <span className="text-white font-bold">{impliedProb}%</span>
                    </div>

                    {/* Tooltip on cell */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-[#121316] border border-white/[0.08] rounded-xl p-3 shadow-2xl z-45 opacity-0 pointer-events-none group-hover/timeline:opacity-100 transition-opacity duration-200">
                      <div className="text-[8.5px] font-black text-successor-mint uppercase tracking-wider mb-1.5 border-b border-white/[0.04] pb-1">
                        Odds Details
                      </div>
                      <div className="space-y-1 font-mono text-[8px] text-gray-300">
                        <div className="flex justify-between">
                          <span>Gegner:</span>
                          <span className="text-white truncate font-bold">{fixture.opponent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Datum:</span>
                          <span className="text-white font-bold">{fixture.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quoten:</span>
                          <span className="text-white font-bold">{fixture.mockOdds.home}-{fixture.mockOdds.away}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="text-[9.5px] font-mono text-successor-textMuted pt-4 border-t border-white/[0.03] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-successor-mint"></span>
            <span>Tip: FDR {activeTeam.strength} bedeutet ein Gegner-Power-Rating von {activeTeam.strength}/5.</span>
          </div>
        </div>

        {/* Easiest/Hardest Runs (1/3 width) */}
        <div className="space-y-4">
          
          {/* Card 1: Easiest Runs */}
          <div className="glass-card rounded-2xl p-4.5 border-l-2 border-l-successor-mint">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles size={13} className="text-successor-mint" />
                Bester Run (Sptg. {gwRange})
              </h2>
              <span className="text-[8.5px] font-mono text-successor-mint bg-successor-mint/10 px-1.5 py-0.5 rounded">Einfach</span>
            </div>
            <div className="space-y-2">
              {easiestTeams.map((team, idx) => (
                <div key={team.abbr} className="flex justify-between items-center text-xs py-1 border-b border-white/[0.02] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] font-mono font-bold text-gray-500">#{idx + 1}</span>
                    <img src={TEAM_LOGOS[team.abbr]} alt="" className="w-5 h-5 object-contain" />
                    <span className="font-bold text-white text-xs">{team.name}</span>
                  </div>
                  <span className="font-mono font-bold text-successor-mint text-[11px]">{getAverageFdr(team)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Hardest Runs */}
          <div className="glass-card rounded-2xl p-4.5 border-l-2 border-l-red-500">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <TrendingUp size={13} className="text-red-500" />
                Schwerster Run (Sptg. {gwRange})
              </h2>
              <span className="text-[8.5px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Gefahr</span>
            </div>
            <div className="space-y-2">
              {hardestTeams.map((team, idx) => (
                <div key={team.abbr} className="flex justify-between items-center text-xs py-1 border-b border-white/[0.02] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] font-mono font-bold text-gray-500">#{idx + 1}</span>
                    <img src={TEAM_LOGOS[team.abbr]} alt="" className="w-5 h-5 object-contain" />
                    <span className="font-bold text-white text-xs">{team.name}</span>
                  </div>
                  <span className="font-mono font-bold text-red-400 text-[11px]">{getAverageFdr(team)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* COMPACT MATRIX TABLE & POWER RANKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COMPACT MATRIX TABLE (2/3 width) */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border border-white/[0.04]">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Spielplan-Stärke (FDR-Matrix)</h2>
              <span className="text-[9.5px] text-successor-textMuted font-mono">FDR berechnet direkt aus implizierten NEO.bet Match-Siegquoten</span>
            </div>
            
            <div className="flex gap-2.5 items-center text-[8.5px] font-mono text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-successor-mint rounded-sm"></span> 1-2 (Leicht)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-white/[0.05] border border-white/[0.06] rounded-sm"></span> 3 (Neutral)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500/10 border border-red-500/20 rounded-sm"></span> 4-5 (Schwer)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0d0e10]/40 text-[9px] uppercase tracking-[0.15em] font-mono text-successor-textMuted">
                  <th className="py-3.5 px-4">Team</th>
                  <th className="py-3.5 px-3 text-center">Avg FDR</th>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const idx = gwRange === '1-5' ? i + 1 : i + 6;
                    return (
                      <th key={i} className="py-3.5 px-2 text-center">GW {idx}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {teams.map((team) => {
                  const avgFdr = getAverageFdr(team);
                  const activeTeamFixtures = gwRange === '1-5' ? team.fixtures.slice(0, 5) : team.fixtures.slice(5, 10);
                  
                  return (
                    <tr key={team.name} className="hover:bg-white/[0.01] transition-colors">
                      {/* Compact Team Cell */}
                      <td className="py-2.5 px-4 flex items-center gap-2">
                        <img src={TEAM_LOGOS[team.abbr]} alt="" className="w-5.5 h-5.5 object-contain flex-shrink-0" />
                        <span className="text-[11px] font-black text-white whitespace-nowrap">{team.name}</span>
                      </td>

                      {/* Average FDR */}
                      <td className="py-2.5 px-3 text-center font-mono font-black text-[11px] text-white">
                        {avgFdr}
                      </td>

                      {/* gwRange Fixtures */}
                      {activeTeamFixtures.map((fixture, fIdx) => {
                        const fdr = calcFdr(fixture);

                        return (
                          <td key={fIdx} className="py-2.5 px-1 text-center">
                            <div className={`w-11 py-1 rounded text-center text-[8.5px] font-black uppercase mx-auto ${getDifficultyColor(fdr)}`}>
                              {fixture.opponentAbbr}
                              <span className="text-[6.5px] font-normal lowercase block">
                                {fixture.isHome ? 'h' : 'a'}
                              </span>
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

        {/* POWER RANKINGS (1/3 width) */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-white/[0.04]">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Saison-Power-Ratings</h2>
              <span className="text-[9px] font-mono text-successor-mint bg-successor-mint/10 px-1.5 py-0.5 rounded uppercase">Impliziert</span>
            </div>
            <p className="text-[9.5px] text-successor-textMuted font-mono mb-4">
              Errechnet aus NEO.bet Quoten der Spieltage 1 &amp; 2
            </p>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
              {teams.sort((a, b) => a.rank - b.rank).map((team, idx) => (
                <div key={team.abbr} className="flex justify-between items-center py-2 border-b border-white/[0.02] last:border-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[9.5px] font-mono font-bold text-gray-500 w-4 text-right">#{idx + 1}</span>
                    <img src={TEAM_LOGOS[team.abbr]} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                    <span className="text-xs font-bold text-white truncate">{team.name}</span>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-black text-white font-mono">FDR {team.strength} / 5</div>
                  </div>
                </div>
              ))}
            </div>
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
          <div className="space-y-3.5">
            <div>
              <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Spieler / Team A</label>
              <div className="relative flex items-center">
                <img src={TEAM_LOGOS[teams[teamAIdx].abbr]} alt="" className="absolute left-3.5 w-5.5 h-5.5 object-contain pointer-events-none" />
                <select
                  value={teamAIdx}
                  onChange={e => setTeamAIdx(Number(e.target.value))}
                  className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2.5 pl-11 pr-3.5 text-xs font-bold text-white focus:border-successor-mint/50 focus:outline-none transition-all"
                >
                  {teams.map((t, idx) => (
                    <option key={t.abbr} value={idx}>{t.name} (FDR: {getAverageFdr(t)})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Spieler / Team B</label>
              <div className="relative flex items-center">
                <img src={TEAM_LOGOS[teams[teamBIdx].abbr]} alt="" className="absolute left-3.5 w-5.5 h-5.5 object-contain pointer-events-none" />
                <select
                  value={teamBIdx}
                  onChange={e => setTeamBIdx(Number(e.target.value))}
                  className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2.5 pl-11 pr-3.5 text-xs font-bold text-white focus:border-successor-mint/50 focus:outline-none transition-all"
                >
                  {teams.map((t, idx) => (
                    <option key={t.abbr} value={idx}>{t.name} (FDR: {getAverageFdr(t)})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Rotation visual side by side */}
          <div className="p-4 bg-[#0d0e10]/50 border border-white/[0.04] rounded-xl flex flex-col justify-between space-y-3">
            <div className="text-[10px] font-mono text-successor-textMuted uppercase">Rotation für Spieltag (GW {gwRange === '1-5' ? '1-5' : '6-10'}):</div>
            
            <div className="flex justify-between items-center">
              {/* Display fixtures */}
              {Array.from({ length: 5 }).map((_, i) => {
                const idx = gwRange === '1-5' ? i : i + 5;
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

    </div>
  );
}
