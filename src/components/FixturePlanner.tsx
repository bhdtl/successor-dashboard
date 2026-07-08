import { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Sliders,
  ChevronDown,
  Search,
  X,
  Check
} from 'lucide-react';

interface TeamFixture {
  opponent: string;
  opponentAbbr: string;
  isHome: boolean;
  date: string;
}

interface TeamData {
  name: string;
  abbr: string;
  avatarColor: string;
  fixtures: TeamFixture[];
}

// Local club logo asset mappings
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

// Static Team Strength Tier Map (FPL/Kickbase standard: 1 to 5)
const TEAM_STRENGTHS: Record<string, number> = {
  'FCB': 5, // Bayern
  'B04': 5, // Leverkusen
  'BVB': 5, // Dortmund
  'RBL': 5, // Leipzig
  'VFB': 4, // Stuttgart
  'SGE': 4, // Frankfurt
  'SCF': 4, // Freiburg
  'TSG': 3, // Hoffenheim
  'SVW': 3, // Bremen
  'BMG': 3, // Gladbach
  'FCU': 3, // Union Berlin
  'M05': 3, // Mainz 05
  'FCA': 2, // Augsburg
  'HSV': 2, // Hamburg
  'S04': 2, // Schalke
  'SCP': 2, // Paderborn
  'SVE': 2, // Elversberg
  'KOE': 2  // Köln
};

const INITIAL_TEAMS: TeamData[] = [
  {
    name: 'FC Bayern München',
    abbr: 'FCB',
    avatarColor: 'from-red-600 to-red-950',
    fixtures: [
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, date: '28.08.2026' },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: false, date: '05.09.2026' },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, date: '12.09.2026' },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: true, date: '19.09.2026' },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, date: '10.10.2026' },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, date: '17.10.2026' },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, date: '24.10.2026' },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, date: '31.10.2026' },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, date: '07.11.2026' },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, date: '21.11.2026' }
    ]
  },
  {
    name: 'Bayer 04 Leverkusen',
    abbr: 'B04',
    avatarColor: 'from-red-600 to-black',
    fixtures: [
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, date: '29.08.2026' },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: true, date: '05.09.2026' },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, date: '12.09.2026' },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, date: '19.09.2026' },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, date: '10.10.2026' },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, date: '17.10.2026' },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, date: '24.10.2026' },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, date: '31.10.2026' },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: false, date: '07.11.2026' },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, date: '21.11.2026' }
    ]
  },
  {
    name: 'Borussia Dortmund',
    abbr: 'BVB',
    avatarColor: 'from-yellow-500 to-black',
    fixtures: [
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, date: '29.08.2026' },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, date: '05.09.2026' },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, date: '12.09.2026' },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, date: '19.09.2026' },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, date: '10.10.2026' },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, date: '17.10.2026' },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, date: '24.10.2026' },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, date: '31.10.2026' },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, date: '07.11.2026' },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, date: '21.11.2026' }
    ]
  },
  {
    name: 'RB Leipzig',
    abbr: 'RBL',
    avatarColor: 'from-blue-600 to-red-600',
    fixtures: [
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, date: '29.08.2026' },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, date: '05.09.2026' },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, date: '12.09.2026' },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, date: '19.09.2026' },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, date: '10.10.2026' },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, date: '17.10.2026' },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, date: '24.10.2026' },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: false, date: '31.10.2026' },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: true, date: '07.11.2026' },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, date: '21.11.2026' }
    ]
  },
  {
    name: 'VfB Stuttgart',
    abbr: 'VFB',
    avatarColor: 'from-red-500 to-white',
    fixtures: [
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, date: '28.08.2026' },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, date: '05.09.2026' },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, date: '12.09.2026' },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, date: '19.09.2026' },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, date: '10.10.2026' },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, date: '17.10.2026' },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, date: '24.10.2026' },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, date: '31.10.2026' },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, date: '07.11.2026' },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: false, date: '21.11.2026' }
    ]
  },
  {
    name: 'Eintracht Frankfurt',
    abbr: 'SGE',
    avatarColor: 'from-black to-red-600',
    fixtures: [
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, date: '29.08.2026' },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: true, date: '05.09.2026' },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, date: '12.09.2026' },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, date: '19.09.2026' },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, date: '10.10.2026' },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, date: '17.10.2026' },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, date: '24.10.2026' },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, date: '31.10.2026' },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, date: '07.11.2026' },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, date: '21.11.2026' }
    ]
  },
  {
    name: 'Sport-Club Freiburg',
    abbr: 'SCF',
    avatarColor: 'from-red-600 to-black',
    fixtures: [
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, date: '29.08.2026' },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, date: '05.09.2026' },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, date: '12.09.2026' },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, date: '19.09.2026' },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, date: '10.10.2026' },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, date: '17.10.2026' },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, date: '24.10.2026' },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, date: '31.10.2026' },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: true, date: '07.11.2026' },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, date: '21.11.2026' }
    ]
  },
  {
    name: 'TSG Hoffenheim',
    abbr: 'TSG',
    avatarColor: 'from-blue-600 to-blue-900',
    fixtures: [
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: false, date: '29.08.2026' },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, date: '05.09.2026' },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, date: '12.09.2026' },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: false, date: '19.09.2026' },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, date: '10.10.2026' },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, date: '17.10.2026' },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: true, date: '24.10.2026' },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, date: '31.10.2026' },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, date: '07.11.2026' },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, date: '21.11.2026' }
    ]
  },
  {
    name: 'SV Werder Bremen',
    abbr: 'SVW',
    avatarColor: 'from-emerald-600 to-black',
    fixtures: [
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, date: '29.08.2026' },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, date: '05.09.2026' },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: false, date: '12.09.2026' },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: true, date: '19.09.2026' },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, date: '10.10.2026' },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, date: '17.10.2026' },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, date: '24.10.2026' },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, date: '31.10.2026' },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: false, date: '07.11.2026' },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, date: '21.11.2026' }
    ]
  },
  {
    name: 'Borussia Mönchengladbach',
    abbr: 'BMG',
    avatarColor: 'from-gray-500 to-black',
    fixtures: [
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, date: '29.08.2026' },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, date: '05.09.2026' },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, date: '12.09.2026' },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: true, date: '19.09.2026' },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, date: '10.10.2026' },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, date: '17.10.2026' },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: false, date: '24.10.2026' },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, date: '31.10.2026' },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: true, date: '07.11.2026' },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, date: '21.11.2026' }
    ]
  },
  {
    name: '1. FC Union Berlin',
    abbr: 'FCU',
    avatarColor: 'from-red-500 to-black',
    fixtures: [
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, date: '29.08.2026' },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, date: '05.09.2026' },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, date: '12.09.2026' },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, date: '19.09.2026' },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, date: '10.10.2026' },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: true, date: '17.10.2026' },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, date: '24.10.2026' },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, date: '31.10.2026' },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, date: '07.11.2026' },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, date: '21.11.2026' }
    ]
  },
  {
    name: 'FC Augsburg',
    abbr: 'FCA',
    avatarColor: 'from-emerald-700 to-red-600',
    fixtures: [
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, date: '29.08.2026' },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, date: '05.09.2026' },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: true, date: '12.09.2026' },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, date: '19.09.2026' },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, date: '10.10.2026' },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, date: '17.10.2026' },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: true, date: '24.10.2026' },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, date: '31.10.2026' },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, date: '07.11.2026' },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: true, date: '21.11.2026' }
    ]
  },
  {
    name: '1. FSV Mainz 05',
    abbr: 'M05',
    avatarColor: 'from-red-600 to-white',
    fixtures: [
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, date: '29.08.2026' },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, date: '05.09.2026' },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, date: '12.09.2026' },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, date: '19.09.2026' },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: false, date: '10.10.2026' },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, date: '17.10.2026' },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, date: '24.10.2026' },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, date: '07.11.2026' },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, date: '21.11.2026' },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, date: '21.11.2026' }
    ]
  },
  {
    name: 'Hamburger SV',
    abbr: 'HSV',
    avatarColor: 'from-blue-600 to-black',
    fixtures: [
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, date: '29.08.2026' },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: true, date: '05.09.2026' },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, date: '12.09.2026' },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: true, date: '19.09.2026' },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, date: '10.10.2026' },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, date: '17.10.2026' },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, date: '07.11.2026' },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, date: '31.10.2026' },
      { opponent: 'SC Paderborn 07', opponentAbbr: 'SCP', isHome: true, date: '24.10.2026' },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, date: '21.11.2026' }
    ]
  },
  {
    name: 'FC Schalke 04',
    abbr: 'S04',
    avatarColor: 'from-blue-600 to-black',
    fixtures: [
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: false, date: '29.08.2026' },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, date: '05.09.2026' },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, date: '12.09.2026' },
      { opponent: 'SV Elversberg', opponentAbbr: 'SVE', isHome: true, date: '19.09.2026' },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: false, date: '10.10.2026' },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, date: '17.10.2026' },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: true, date: '31.10.2026' },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: false, date: '07.11.2026' },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, date: '21.11.2026' },
      { opponent: '1. FC Köln', opponentAbbr: 'KOE', isHome: false, date: '21.11.2026' }
    ]
  },
  {
    name: 'SC Paderborn 07',
    abbr: 'SCP',
    avatarColor: 'from-blue-600 to-black',
    fixtures: [
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: false, date: '29.08.2026' },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, date: '05.09.2026' },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, date: '12.09.2026' },
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, date: '19.09.2026' },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: true, date: '10.10.2026' },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: false, date: '17.10.2026' },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, date: '24.10.2026' },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, date: '31.10.2026' },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: true, date: '07.11.2026' },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: false, date: '21.11.2026' }
    ]
  },
  {
    name: 'SV Elversberg',
    abbr: 'SVE',
    avatarColor: 'from-gray-700 to-black',
    fixtures: [
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: true, date: '29.08.2026' },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: false, date: '05.09.2026' },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: true, date: '12.09.2026' },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: false, date: '19.09.2026' },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, date: '10.10.2026' },
      { opponent: 'FC Augsburg', opponentAbbr: 'FCA', isHome: true, date: '17.10.2026' },
      { opponent: 'RB Leipzig', opponentAbbr: 'RBL', isHome: false, date: '24.10.2026' },
      { opponent: '1. FSV Mainz 05', opponentAbbr: 'M05', isHome: true, date: '21.11.2026' },
      { opponent: 'Borussia Dortmund', opponentAbbr: 'BVB', isHome: false, date: '07.11.2026' },
      { opponent: 'Sport-Club Freiburg', opponentAbbr: 'SCF', isHome: true, date: '21.11.2026' }
    ]
  },
  {
    name: '1. FC Köln',
    abbr: 'KOE',
    avatarColor: 'from-red-500 to-white',
    fixtures: [
      { opponent: 'TSG Hoffenheim', opponentAbbr: 'TSG', isHome: true, date: '29.08.2026' },
      { opponent: 'VfB Stuttgart', opponentAbbr: 'VFB', isHome: false, date: '05.09.2026' },
      { opponent: 'SV Werder Bremen', opponentAbbr: 'SVW', isHome: true, date: '12.09.2026' },
      { opponent: 'Hamburger SV', opponentAbbr: 'HSV', isHome: false, date: '19.09.2026' },
      { opponent: 'Borussia Mönchengladbach', opponentAbbr: 'BMG', isHome: true, date: '10.10.2026' },
      { opponent: 'Eintracht Frankfurt', opponentAbbr: 'SGE', isHome: false, date: '17.10.2026' },
      { opponent: 'Bayer 04 Leverkusen', opponentAbbr: 'B04', isHome: true, date: '07.11.2026' },
      { opponent: '1. FC Union Berlin', opponentAbbr: 'FCU', isHome: false, date: '31.10.2026' },
      { opponent: 'FC Schalke 04', opponentAbbr: 'S04', isHome: true, date: '21.11.2026' },
      { opponent: 'FC Bayern München', opponentAbbr: 'FCB', isHome: false, date: '21.11.2026' }
    ]
  }
];

export function FixturePlanner() {
  const [teams] = useState<TeamData[]>(INITIAL_TEAMS);
  const [selectedTeamIdx, setSelectedTeamIdx] = useState<number>(0); // Default: Bayern
  const [gwRange, setGwRange] = useState<'1-5' | '6-10'>('1-5');

  // Custom Searchable Selector modal states
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Rotation planner states
  const [teamAIdx, setTeamAIdx] = useState<number>(0);
  const [teamBIdx, setTeamBIdx] = useState<number>(10);

  // Purely static FDR calculation
  const calcFdr = (fixture: TeamFixture) => {
    const oppStrength = TEAM_STRENGTHS[fixture.opponentAbbr] || 3;
    if (fixture.isHome) {
      return Math.max(1, oppStrength - 1);
    } else {
      return Math.min(5, oppStrength);
    }
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

  const getDifficultyDotColor = (fdr: number) => {
    switch (fdr) {
      case 1:
        return 'bg-[#00ff88]';
      case 2:
        return 'bg-emerald-500';
      case 3:
        return 'bg-gray-500';
      case 4:
        return 'bg-orange-400';
      case 5:
      default:
        return 'bg-red-500';
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

  // Rotation score
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

  const activeTeam = teams[selectedTeamIdx];
  const activeFixtures = gwRange === '1-5' ? activeTeam.fixtures.slice(0, 5) : activeTeam.fixtures.slice(5, 10);
  const avgFdrVal = Number(getAverageFdr(activeTeam));

  // Y Coordinate mapping for SVG Bezier curve line
  // 50% is center baseline. FDR 1 is at 20% (top). FDR 5 is at 80% (bottom).
  const getYCoordinate = (fdr: number) => {
    return 50 + (fdr - 3) * 15;
  };

  const yValues = activeFixtures.map(fix => getYCoordinate(calcFdr(fix)));
  const [y1, y2, y3, y4, y5] = yValues;
  const pathD = `M 10 ${y1} C 20 ${y1}, 20 ${y2}, 30 ${y2} C 40 ${y2}, 40 ${y3}, 50 ${y3} C 60 ${y3}, 60 ${y4}, 70 ${y4} C 80 ${y4}, 80 ${y5}, 90 ${y5}`;

  // Filtered teams list based on search query
  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.abbr.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 select-none pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <img src={BUNDESLIGA_LOGO} alt="" className="h-6 w-6 object-contain opacity-80" style={{ width: '24px', height: '24px' }} />
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Spielplan &amp; FDR Matrix</h1>
        </div>

        {/* Range selectors */}
        <div className="flex gap-1 bg-[#13151a] p-1 border border-white/[0.04] rounded-xl">
          <button
            onClick={() => setGwRange('1-5')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${gwRange === '1-5' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Spieltage 1 - 5
          </button>
          <button
            onClick={() => setGwRange('6-10')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${gwRange === '6-10' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Spieltage 6 - 10
          </button>
        </div>
      </div>

      {/* SOFASCORE-STYLE PREMIUM TIMELINE CHART CARD */}
      <div className="glass-card rounded-2xl p-5 space-y-6 border border-white/[0.04] overflow-hidden">
        
        {/* Top selector & average badge */}
        <div className="flex flex-row justify-between items-center gap-3 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-successor-textMuted font-mono hidden sm:inline">
              FDR-Trendverlauf:
            </span>
            
            {/* Custom Revolut-style select button */}
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSelectOpen(true);
              }}
              className="flex items-center gap-2.5 bg-[#0d0e12]/80 hover:bg-black border border-white/[0.06] hover:border-white/10 rounded-xl px-3.5 py-2 text-xs font-black text-white transition-all shadow-inner"
            >
              <img src={TEAM_LOGOS[activeTeam.abbr]} alt="" className="w-5 h-5 object-contain" style={{ width: '20px', height: '20px' }} />
              <span>{activeTeam.name}</span>
              <ChevronDown size={12} className="text-gray-500 ml-0.5" />
            </button>
          </div>

          {/* Average Rating indicator (Right aligned, Sofascore style badge) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-successor-textMuted font-mono uppercase tracking-wider hidden xs:inline">Durchschn. FDR:</span>
            <div className="flex items-center gap-1.5 bg-[#00ff88]/10 border border-[#00ff88]/20 px-2.5 py-1 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.5)]"></span>
              <span className="text-xs font-black font-mono text-white">{avgFdrVal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Interactive Custom SVG Trend Chart (Scrollable on mobile) */}
        <div className="w-full overflow-x-auto no-scrollbar pb-2">
          <div className="relative w-full min-w-[650px] lg:min-w-0 h-44">
            
            {/* Background Bezier Trend Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path
                d={pathD}
                fill="none"
                stroke="#00ff88"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.65"
                className="drop-shadow-[0_0_4px_rgba(0,255,136,0.4)]"
              />
            </svg>

            {/* Horizontal average line */}
            <div className="absolute top-[50%] -translate-y-1/2 left-0 right-0 h-[1px] border-t border-dashed border-[#00ff88]/30 flex items-center justify-end pr-2 z-0">
              <span className="text-[8px] font-mono text-[#00ff88]/80 bg-[#181a20] px-1.5 py-0.5 rounded-md border border-[#00ff88]/10 select-none">
                Schnitt: {avgFdrVal.toFixed(1)}
              </span>
            </div>

            {/* Render Nodes along the line (with absolute alignments) */}
            <div className="absolute inset-0 z-10 select-none">
              {activeFixtures.map((fixture, index) => {
                const fIdx = gwRange === '1-5' ? index : index + 5;
                const fdr = calcFdr(fixture);

                return (
                  <div 
                    key={index} 
                    className="absolute -translate-x-1/2 top-0 bottom-0 w-24 flex flex-col justify-between items-center py-2 group/trend"
                    style={{ left: `${10 + index * 20}%` }}
                  >
                    
                    {/* Top Static Section: Date & Flag */}
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <span className="text-[8px] font-mono font-bold text-gray-500">{fixture.date}</span>
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-white/[0.08] bg-[#0d0e12] p-0.5 flex items-center justify-center shadow-inner" style={{ width: '24px', height: '24px' }}>
                        <img src={TEAM_LOGOS[fixture.opponentAbbr]} alt="" className="w-full h-full object-contain" style={{ width: '20px', height: '20px' }} />
                      </div>
                    </div>

                    {/* Middle Floating Element: Rating Badge (Plotted on SVG Y position) */}
                    <div 
                      className={`absolute w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white font-mono shadow-2xl transition-transform duration-150 hover:scale-120 cursor-pointer -translate-y-1/2 z-25 border border-white/10 ${
                        fdr <= 2 ? 'bg-emerald-500 shadow-emerald-500/20' : fdr === 3 ? 'bg-gray-600' : fdr === 4 ? 'bg-orange-500 shadow-orange-500/20' : 'bg-red-500 shadow-red-500/20'
                      }`}
                      style={{ top: `${getYCoordinate(fdr)}%` }}
                    >
                      {fdr}
                      
                      {/* Tooltip detail card */}
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-40 bg-[#121316] border border-white/[0.08] rounded-xl p-3 shadow-2xl z-50 opacity-0 pointer-events-none group-hover/trend:opacity-100 transition-opacity duration-200">
                        <div className="text-[9px] font-black text-successor-mint uppercase mb-1.5 border-b border-white/[0.04] pb-1 tracking-wider">
                          Spieltag GW {fIdx + 1}
                        </div>
                        <div className="space-y-1 font-mono text-[8.5px] text-gray-300">
                          <div className="text-white truncate font-bold">{fixture.opponent}</div>
                          <div className="flex justify-between">
                            <span>Ort:</span>
                            <span className="text-white font-bold">{fixture.isHome ? 'Heimspiel' : 'Auswärts'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>FDR:</span>
                            <span className="text-white font-bold">{fdr} / 5</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Static Section: Name & Venue */}
                    <div className="flex flex-col items-center mb-1">
                      <span className="text-[10.5px] font-black text-white uppercase tracking-wider">{fixture.opponentAbbr}</span>
                      <span className="text-[7.5px] font-mono text-successor-textMuted uppercase tracking-wide">
                        {fixture.isHome ? 'Heim' : 'Auswärts'}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* BEST / WORST RUNS WIDGETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Card 1: Easiest Runs */}
        <div className="glass-card rounded-2xl p-5 border border-white/[0.04] border-l-2 border-l-successor-mint space-y-4">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/90 flex items-center gap-1.5">
              <Sparkles size={12} className="text-successor-mint animate-pulse" />
              Bester Run (Sptg. {gwRange})
            </h2>
            <span className="text-[8.5px] font-mono text-successor-mint bg-successor-mint/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Einfach
            </span>
          </div>
          <div className="space-y-1">
            {easiestTeams.map((team, idx) => (
              <div key={team.abbr} className="flex justify-between items-center text-xs py-2.5 border-b border-white/[0.02] last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono font-bold text-gray-500 w-4">#{idx + 1}</span>
                  <img src={TEAM_LOGOS[team.abbr]} alt="" className="w-5.5 h-5.5 object-contain" style={{ width: '22px', height: '22px' }} />
                  <span className="font-semibold text-white/90 text-xs">{team.name}</span>
                </div>
                <span className="font-mono font-black text-[11px] text-successor-mint bg-successor-mint/10 px-2.5 py-0.5 rounded-md">
                  {getAverageFdr(team)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Hardest Runs */}
        <div className="glass-card rounded-2xl p-5 border border-white/[0.04] border-l-2 border-l-red-500 space-y-4">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/90 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-red-500" />
              Schwerster Run (Sptg. {gwRange})
            </h2>
            <span className="text-[8.5px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Gefahr
            </span>
          </div>
          <div className="space-y-1">
            {hardestTeams.map((team, idx) => (
              <div key={team.abbr} className="flex justify-between items-center text-xs py-2.5 border-b border-white/[0.02] last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono font-bold text-gray-500 w-4">#{idx + 1}</span>
                  <img src={TEAM_LOGOS[team.abbr]} alt="" className="w-5.5 h-5.5 object-contain" style={{ width: '22px', height: '22px' }} />
                  <span className="font-semibold text-white/90 text-xs">{team.name}</span>
                </div>
                <span className="font-mono font-black text-[11px] text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-md">
                  {getAverageFdr(team)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* NEXTXI-STYLE CLEAN FDR MATRIX GRID (FULL WIDTH) */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.04]">
        <div className="p-5 border-b border-white/[0.05] flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Spielplan-Stärke (FDR-Matrix)</h2>
            <p className="text-[10px] text-successor-textMuted font-mono mt-0.5">Übersicht aller Bundesliga-Clubs und Spieltage</p>
          </div>
          
          {/* Status badge legend pills (Apple Style) */}
          <div className="flex flex-wrap gap-2 items-center text-[9px] font-mono select-none">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[#00ff88] font-bold">
              1-2 Leicht
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-gray-400">
              3 Neutral
            </span>
            <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
              4-5 Schwer
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.05] bg-[#0d0e10]/40 text-[9px] uppercase tracking-[0.12em] font-mono text-successor-textMuted">
                <th className="py-3.5 px-6">Verein</th>
                <th className="py-3.5 px-5 text-center">Avg FDR</th>
                {Array.from({ length: 5 }).map((_, i) => {
                  const idx = gwRange === '1-5' ? i + 1 : i + 6;
                  return (
                    <th key={i} className="py-3.5 px-4 text-center">GW {idx}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {teams.map((team) => {
                const avgFdr = getAverageFdr(team);
                const activeTeamFixtures = gwRange === '1-5' ? team.fixtures.slice(0, 5) : team.fixtures.slice(5, 10);
                
                return (
                  <tr key={team.name} className="hover:bg-white/[0.01] transition-colors">
                    {/* Compact Team Cell with tiny standard logo */}
                    <td className="py-3 px-6 flex items-center gap-2.5">
                      <img src={TEAM_LOGOS[team.abbr]} alt="" className="w-5 h-5 object-contain flex-shrink-0" style={{ width: '20px', height: '20px' }} />
                      <span className="text-[11.5px] font-bold text-white whitespace-nowrap">{team.name}</span>
                    </td>

                    {/* Average FDR */}
                    <td className="py-3 px-5 text-center font-mono font-black text-xs text-white">
                      {avgFdr}
                    </td>

                    {/* gameweeks */}
                    {activeTeamFixtures.map((fixture, fIdx) => {
                      const fdr = calcFdr(fixture);

                      return (
                        <td key={fIdx} className="py-3 px-3 text-center">
                          <div className="relative inline-flex items-center gap-1.5 bg-[#0d0e10]/60 border border-white/[0.05] pl-2 pr-2.5 py-1 rounded-lg text-[9px] font-black uppercase text-white hover:border-white/10 transition-colors">
                            {/* Tiny indicator dot showing difficulty */}
                            <span className={`w-1.5 h-1.5 rounded-full ${getDifficultyDotColor(fdr)}`}></span>
                            <span>{fixture.opponentAbbr}</span>
                            <span className="text-[7.5px] font-mono text-gray-500 font-normal lowercase">
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

      {/* ROTATION PLANNER COMPONENT */}
      <div className="glass-card rounded-2xl p-5 space-y-4 border border-white/[0.04]">
        <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Sliders size={14} className="text-successor-mint" />
            Torhüter- &amp; Roster-Rotationsplaner
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-successor-textMuted uppercase">Match-Score</span>
            <div className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono ${rotScore >= 80 ? 'bg-successor-mint/10 text-successor-mint' : rotScore >= 50 ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'}`}>
              {rotScore}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Selectors */}
          <div className="space-y-3.5">
            <div>
              <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Spieler / Team A</label>
              <div className="relative flex items-center">
                <img src={TEAM_LOGOS[teams[teamAIdx].abbr]} alt="" className="absolute left-3 w-5 h-5 object-contain pointer-events-none" style={{ width: '20px', height: '20px' }} />
                <select
                  value={teamAIdx}
                  onChange={e => setTeamAIdx(Number(e.target.value))}
                  className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 pl-10 pr-3.5 text-xs font-bold text-white focus:border-successor-mint/50 focus:outline-none transition-all cursor-pointer"
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
                <img src={TEAM_LOGOS[teams[teamBIdx].abbr]} alt="" className="absolute left-3 w-5 h-5 object-contain pointer-events-none" style={{ width: '20px', height: '20px' }} />
                <select
                  value={teamBIdx}
                  onChange={e => setTeamBIdx(Number(e.target.value))}
                  className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 pl-10 pr-3.5 text-xs font-bold text-white focus:border-successor-mint/50 focus:outline-none transition-all cursor-pointer"
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
            <div className="text-[10px] font-mono text-gray-500 uppercase font-black">Rotations-Auswahl (GW {gwRange === '1-5' ? '1-5' : '6-10'}):</div>
            
            <div className="flex justify-between items-center">
              {Array.from({ length: 5 }).map((_, i) => {
                const idx = gwRange === '1-5' ? i : i + 5;
                const fixA = teams[teamAIdx].fixtures[idx];
                const fixB = teams[teamBIdx].fixtures[idx];
                const fdrA = calcFdr(fixA);
                const fdrB = calcFdr(fixB);
                
                const startA = fdrA <= fdrB;

                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className="text-[8px] font-mono font-bold text-gray-500 uppercase">GW {idx + 1}</span>
                    <div className="flex flex-col gap-1">
                      {/* Team A dot */}
                      <div className={`w-8 py-0.5 rounded text-center text-[8.5px] font-black uppercase ${getDifficultyColor(fdrA)} ${startA ? 'ring-2 ring-white/50' : 'opacity-40'}`}>
                        {fixA.opponentAbbr}
                      </div>
                      {/* Team B dot */}
                      <div className={`w-8 py-0.5 rounded text-center text-[8.5px] font-black uppercase ${getDifficultyColor(fdrB)} ${!startA ? 'ring-2 ring-white/50' : 'opacity-40'}`}>
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
                : '⚠️ Hinweis: Zu viele Spieltage, an denen beide Spieler schwere Partien gleichzeitig haben.'}
            </div>
          </div>
        </div>
      </div>

      {/* REVOLUT / APPLE STYLE CUSTOM SEARCHABLE SELECTOR MODAL */}
      {isSelectOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
          <div className="bg-[#181a20] border border-white/[0.08] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Verein auswählen</h3>
                <p className="text-[9.5px] text-successor-textMuted font-mono">Suche deinen Bundesliga-Club aus</p>
              </div>
              <button 
                onClick={() => setIsSelectOpen(false)}
                className="p-1.5 bg-[#0d0e12] border border-white/[0.04] rounded-lg text-gray-400 hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Live Search input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Name oder Kürzel suchen..."
                className="w-full bg-[#0d0e12] border border-white/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder-gray-500 focus:border-successor-mint/45 focus:outline-none transition-all shadow-inner"
                autoFocus
              />
            </div>

            {/* List of clubs */}
            <div className="overflow-y-auto pr-1 space-y-1.5 max-h-[350px] no-scrollbar">
              {filteredTeams.length > 0 ? (
                filteredTeams.map((team) => {
                  const isSelected = team.abbr === activeTeam.abbr;
                  const idx = teams.findIndex(t => t.abbr === team.abbr);
                  
                  return (
                    <button
                      key={team.abbr}
                      onClick={() => {
                        setSelectedTeamIdx(idx);
                        setIsSelectOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                        isSelected 
                          ? 'bg-successor-mint/5 border-successor-mint/20 text-white' 
                          : 'bg-[#0d0e12]/40 border-white/[0.02] hover:bg-[#0d0e12]/80 hover:border-white/[0.06] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={TEAM_LOGOS[team.abbr]} alt="" className="w-6 h-6 object-contain" style={{ width: '24px', height: '24px' }} />
                        <div className="text-left">
                          <div className="text-xs font-black text-white">{team.name}</div>
                          <span className="text-[8.5px] font-mono text-gray-500 uppercase">{team.abbr}</span>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <Check size={14} className="text-successor-mint" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-[10px] font-mono text-gray-500">
                  Keine Vereine gefunden
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
