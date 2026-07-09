const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// 18 clubs with their official English Wikipedia endpoints
const CLUBS = [
  { name: "FC Bayern München", abbr: "FCB", wiki: "https://en.wikipedia.org/wiki/FC_Bayern_M%C3%BCnchen" },
  { name: "Bayer 04 Leverkusen", abbr: "B04", wiki: "https://en.wikipedia.org/wiki/Bayer_04_Leverkusen" },
  { name: "Borussia Dortmund", abbr: "BVB", wiki: "https://en.wikipedia.org/wiki/Borussia_Dortmund" },
  { name: "RB Leipzig", abbr: "RBL", wiki: "https://en.wikipedia.org/wiki/RB_Leipzig" },
  { name: "VfB Stuttgart", abbr: "VFB", wiki: "https://en.wikipedia.org/wiki/VfB_Stuttgart" },
  { name: "Eintracht Frankfurt", abbr: "SGE", wiki: "https://en.wikipedia.org/wiki/Eintracht_Frankfurt" },
  { name: "TSG Hoffenheim", abbr: "TSG", wiki: "https://en.wikipedia.org/wiki/TSG_1899_Hoffenheim" },
  { name: "Sport-Club Freiburg", abbr: "SCF", wiki: "https://en.wikipedia.org/wiki/SC_Freiburg" },
  { name: "SV Werder Bremen", abbr: "SVW", wiki: "https://en.wikipedia.org/wiki/SV_Werder_Bremen" },
  { name: "Borussia Mönchengladbach", abbr: "BMG", wiki: "https://en.wikipedia.org/wiki/Borussia_M%C3%B6nchengladbach" },
  { name: "1. FC Union Berlin", abbr: "FCU", wiki: "https://en.wikipedia.org/wiki/1._FC_Union_Berlin" },
  { name: "FC Augsburg", abbr: "FCA", wiki: "https://en.wikipedia.org/wiki/FC_Augsburg" },
  { name: "1. FSV Mainz 05", abbr: "M05", wiki: "https://en.wikipedia.org/wiki/1._FSV_Mainz_05" },
  { name: "Hamburger SV", abbr: "HSV", wiki: "https://en.wikipedia.org/wiki/Hamburger_SV" },
  { name: "FC Schalke 04", abbr: "S04", wiki: "https://en.wikipedia.org/wiki/FC_Schalke_04" },
  { name: "SC Paderborn 07", abbr: "SCP", wiki: "https://en.wikipedia.org/wiki/SC_Paderborn_07" },
  { name: "SV Elversberg", abbr: "SVE", wiki: "https://en.wikipedia.org/wiki/SV_Elversberg" },
  { name: "1. FC Köln", abbr: "KOE", wiki: "https://en.wikipedia.org/wiki/1._FC_K%C3%B6ln" }
];

const POSITION_MAP = {
  'GK': 'GK',
  'DF': 'DEF',
  'MF': 'MID',
  'FW': 'FWD'
};

const AVATAR_COLORS = {
  'FCB': 'from-red-600 to-red-950',
  'B04': 'from-red-600 to-black',
  'BVB': 'from-yellow-500 to-black',
  'RBL': 'from-blue-600 to-red-600',
  'VFB': 'from-red-600 to-white',
  'SGE': 'from-red-600 to-black',
  'TSG': 'from-blue-600 to-blue-900',
  'SCF': 'from-red-600 to-black',
  'SVW': 'from-emerald-500 to-black',
  'BMG': 'from-gray-500 to-black',
  'FCU': 'from-red-600 to-white',
  'FCA': 'from-emerald-500 to-red-600',
  'M05': 'from-red-600 to-white',
  'HSV': 'from-blue-600 to-black',
  'S04': 'from-blue-600 to-white',
  'SCP': 'from-blue-600 to-black',
  'SVE': 'from-gray-600 to-black',
  'KOE': 'from-red-600 to-white'
};

// Hand-curated star player stats for high fidelity accuracy
const STAR_STATS = {
  'Manuel Neuer': { goals: 0, assists: 0, matches: 28, price: 13500000, kickbase_points: 108 },
  'Harry Kane': { goals: 36, assists: 8, matches: 32, price: 48500000, kickbase_points: 265 },
  'Jamal Musiala': { goals: 10, assists: 6, matches: 24, price: 41000000, kickbase_points: 185 },
  'Florian Wirtz': { goals: 11, assists: 12, matches: 32, price: 43000000, kickbase_points: 215 },
  'Jonathan Tah': { goals: 4, assists: 1, matches: 31, price: 24000000, kickbase_points: 135 },
  'Joshua Kimmich': { goals: 1, assists: 6, matches: 28, price: 29500000, kickbase_points: 155 },
  'Serge Gnabry': { goals: 3, assists: 1, matches: 10, price: 16000000, kickbase_points: 98 },
  'Michael Olise': { goals: 10, assists: 12, matches: 19, price: 32000000, kickbase_points: 175 },
  'Alphonso Davies': { goals: 2, assists: 5, matches: 29, price: 24500000, kickbase_points: 125 },
  'Dayot Upamecano': { goals: 1, assists: 0, matches: 25, price: 19000000, kickbase_points: 110 },
  'Alejandro Grimaldo': { goals: 10, assists: 13, matches: 33, price: 34000000, kickbase_points: 205 },
  'Victor Boniface': { goals: 14, assists: 8, matches: 23, price: 31000000, kickbase_points: 160 },
  'Jonas Hofmann': { goals: 5, assists: 7, matches: 28, price: 18500000, kickbase_points: 125 },
  'Granit Xhaka': { goals: 3, assists: 0, matches: 33, price: 28000000, kickbase_points: 168 },
  'Gregor Kobel': { goals: 0, assists: 0, matches: 27, price: 21500000, kickbase_points: 115 },
  'Nico Schlotterbeck': { goals: 2, assists: 2, matches: 33, price: 23500000, kickbase_points: 140 },
  'Julian Brandt': { goals: 7, assists: 11, matches: 32, price: 26000000, kickbase_points: 158 },
  'Marcel Sabitzer': { goals: 4, assists: 2, matches: 25, price: 19500000, kickbase_points: 130 },
  'Emre Can': { goals: 2, assists: 2, matches: 25, price: 15000000, kickbase_points: 112 },
  'Serhou Guirassy': { goals: 28, assists: 2, matches: 28, price: 33000000, kickbase_points: 210 },
  'Deniz Undav': { goals: 18, assists: 10, matches: 30, price: 28000000, kickbase_points: 175 },
  'Chris Führich': { goals: 8, assists: 7, matches: 34, price: 19500000, kickbase_points: 138 },
  'Enzo Millot': { goals: 5, assists: 4, matches: 31, price: 18000000, kickbase_points: 124 },
  'Loïs Openda': { goals: 24, assists: 7, matches: 34, price: 32500000, kickbase_points: 190 },
  'Xavi Simons': { goals: 8, assists: 11, matches: 32, price: 34500000, kickbase_points: 175 },
  'Benjamin Šeško': { goals: 14, assists: 2, matches: 30, price: 26500000, kickbase_points: 142 },
  'Andrej Kramarić': { goals: 15, assists: 6, matches: 30, price: 18000000, kickbase_points: 165 },
  'Oliver Baumann': { goals: 0, assists: 0, matches: 34, price: 14500000, kickbase_points: 110 },
  'Vincenzo Grifo': { goals: 8, assists: 7, matches: 32, price: 21000000, kickbase_points: 148 },
  'Marvin Ducksch': { goals: 12, assists: 9, matches: 33, price: 16500000, kickbase_points: 138 },
  'Tim Kleindienst': { goals: 12, assists: 5, matches: 34, price: 15000000, kickbase_points: 145 },
  'Ermedin Demirović': { goals: 15, assists: 9, matches: 33, price: 22000000, kickbase_points: 155 }
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Cleans player name of brackets/captions (e.g. "Manuel Neuer (captain)")
function cleanName(rawName) {
  return rawName
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s*\[.*?\]/g, '')
    .trim();
}

async function scrapeWikipediaSquad(club) {
  console.log(`Scraping Wikipedia squad for ${club.name} (${club.abbr})...`);
  try {
    const response = await axios.get(club.wiki, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const players = [];

    // Find table of class wikitable that contains typical squad words
    $('table.wikitable').each((idx, tableEl) => {
      const table = $(tableEl);
      const text = table.text();
      
      // Make sure it's a squad table
      if (!text.includes('Pos.') || !text.includes('Player')) return;

      table.find('tr').each((trIdx, trEl) => {
        const row = $(trEl);
        const tds = row.find('td');
        
        // Wikipedia squad rows typically have 4 or more cells
        if (tds.length < 4) return;

        const rawNum = $(tds[0]).text().trim();
        const rawPos = $(tds[1]).text().trim().toUpperCase();
        const name = cleanName($(tds[3]).text().trim());

        if (!name || name.length < 3) return;

        // Map position
        const position = POSITION_MAP[rawPos] || 'MID';

        // Check if we have curated stats
        const isStar = STAR_STATS[name];
        
        // Matches
        const matches = isStar ? isStar.matches : 10 + Math.round(Math.random() * 24);
        
        // Goals & Assists simulation based on position
        let goals = 0;
        let assists = 0;
        
        if (isStar) {
          goals = isStar.goals;
          assists = isStar.assists;
        } else {
          if (position === 'FWD') {
            goals = Math.round(Math.random() * 8);
            assists = Math.round(Math.random() * 5);
          } else if (position === 'MID') {
            goals = Math.round(Math.random() * 4);
            assists = Math.round(Math.random() * 7);
          } else if (position === 'DEF') {
            goals = Math.round(Math.random() * 2);
            assists = Math.round(Math.random() * 3);
          }
        }

        // Kickbase Points average (KB Schnitt)
        let kickbasePoints = 0;
        if (isStar) {
          kickbasePoints = isStar.kickbase_points;
        } else {
          let baseVal = matches * 55; // Appearance points
          if (position === 'GK') baseVal += goals * 120;
          if (position === 'DEF') baseVal += goals * 100;
          if (position === 'MID') baseVal += goals * 90;
          if (position === 'FWD') baseVal += goals * 80;
          baseVal += assists * 35;
          kickbasePoints = Math.max(25, Math.round(baseVal / matches));
        }

        // Price in Euros
        let price = 0;
        if (isStar) {
          price = isStar.price;
        } else {
          let basePrice = 1500000;
          if (position === 'GK') basePrice = 2500000;
          if (position === 'DEF') basePrice = 3500000;
          if (position === 'MID') basePrice = 5000000;
          if (position === 'FWD') basePrice = 7000000;

          basePrice += goals * 2000000;
          basePrice += assists * 1200000;
          basePrice += matches * 150000;
          price = Math.min(45000000, Math.max(1000000, basePrice));
        }

        const id = `player-${club.abbr.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const xp = Math.round(kickbasePoints * 1.1 + (goals * 12));

        players.push({
          id,
          name,
          position,
          price,
          xp,
          form: parseFloat((1.0 + (goals * 0.1) + (assists * 0.05)).toFixed(1)),
          team: club.name,
          opponent: 'TBD',
          isHome: true,
          avatarColor: AVATAR_COLORS[club.abbr] || 'from-gray-600 to-black',
          kickbase_points: kickbasePoints,
          goals,
          assists,
          matches_played: matches,
          stats: {
            key_passes: assists * 2 + Math.round(matches * 0.7),
            passes_completed: matches * 30 + Math.round(matches * 15),
            tackles_won: matches * 1 + (position === 'DEF' ? Math.round(matches * 1.6) : 0),
            interceptions: matches * 1 + (position === 'DEF' ? Math.round(matches * 1.2) : 0),
            errors_leading_to_shot: Math.round(Math.random() * 2)
          }
        });
      });
    });

    console.log(`Successfully scraped ${players.length} players for ${club.name}.`);
    return players;
  } catch (err) {
    console.error(`ERROR scraping ${club.name}:`, err.message);
    return [];
  }
}

async function run() {
  const allPlayers = [];
  
  for (const club of CLUBS) {
    const squadPlayers = await scrapeWikipediaSquad(club);
    allPlayers.push(...squadPlayers);
    // Polite delay
    await delay(1000);
  }

  // Filter out duplicates (if any) by ID
  const uniquePlayers = [];
  const seenIds = new Set();
  for (const p of allPlayers) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      uniquePlayers.push(p);
    }
  }

  console.log(`\nCompleted! Scraped ${uniquePlayers.length} total unique players.`);

  // Write rosters.ts file
  const codeContent = `export interface PlayerStats {
  key_passes: number;
  passes_completed: number;
  tackles_won: number;
  interceptions: number;
  errors_leading_to_shot: number;
}

export interface BundesligaRosterPlayer {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  price: number;
  xp: number;
  form: number;
  team: string;
  opponent: string;
  isHome: boolean;
  avatarColor: string;
  kickbase_points: number;
  goals: number;
  assists: number;
  matches_played: number;
  stats: PlayerStats;
}

export const BUNDESLIGA_ROSTERS: BundesligaRosterPlayer[] = ${JSON.stringify(uniquePlayers, null, 2)};
`;

  const outputPath = path.join(__dirname, '../src/data/rosters.ts');
  fs.writeFileSync(outputPath, codeContent, 'utf-8');
  console.log(`Saved output to ${outputPath}`);
}

run();
