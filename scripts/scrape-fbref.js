/**
 * Successor - FBref Bundesliga Player Stats Scraper & Kickbase Points Calculator
 * 
 * To run this script:
 * 1. Install dependencies: npm install axios cheerio dotenv
 * 2. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env
 * 3. Run: node scripts/scrape-fbref.js
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kickbase Position-Dependent Goal points
const KICKBASE_GOAL_POINTS = {
  GK: 120,
  DEF: 100,
  MID: 90,
  FWD: 80
};

// Kickbase Position-Dependent Assist points
const KICKBASE_ASSIST_POINTS = {
  GK: 55,
  DEF: 45,
  MID: 35,
  FWD: 35
};

async function scrapeFBref() {
  console.log('Starting FBref Bundesliga Scraper...');
  
  try {
    const playersMap = new Map();

    // 1. Fetch Standard Stats (Goals, Assists, Playing Time, Team)
    console.log('Fetching Standard Stats...');
    const standardRes = await axios.get('https://fbref.com/en/comps/20/stats/Bundesliga-Stats', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    let $ = cheerio.load(standardRes.data);
    
    $('table#stats_standard tbody tr').each((i, el) => {
      const isPlaceholder = $(el).hasClass('thead');
      if (isPlaceholder) return;

      const name = $(el).find('td[data-stat="player"] a').text().trim();
      const team = $(el).find('td[data-stat="team"] a').text().trim();
      const posRaw = $(el).find('td[data-stat="position"]').text().trim();
      const matches = parseInt($(el).find('td[data-stat="games"]').text().trim()) || 0;
      const goals = parseInt($(el).find('td[data-stat="goals"]').text().trim()) || 0;
      const assists = parseInt($(el).find('td[data-stat="assists"]').text().trim()) || 0;
      const minutes = parseInt($(el).find('td[data-stat="minutes"]').text().trim()) || 0;
      const yellowCards = parseInt($(el).find('td[data-stat="cards_yellow"]').text().trim()) || 0;
      const redCards = parseInt($(el).find('td[data-stat="cards_red"]').text().trim()) || 0;

      if (!name || !team) return;

      // Normalize position to Successor formats
      let position = 'MID';
      if (posRaw.includes('GK')) position = 'GK';
      else if (posRaw.includes('DF')) position = 'DEF';
      else if (posRaw.includes('FW')) position = 'FWD';

      const key = `${name}-${team}`;
      playersMap.set(key, {
        name,
        team,
        position,
        matches_played: matches,
        minutes_played: minutes,
        goals,
        assists,
        yellow_cards: yellowCards,
        red_cards: redCards,
        passes_completed: 0,
        key_passes: 0,
        tackles_won: 0,
        interceptions: 0,
        errors_leading_to_shot: 0,
        kickbase_points: 0
      });
    });

    // 2. Fetch Passing Stats (Passes completed, Key Passes)
    console.log('Fetching Passing Stats...');
    const passingRes = await axios.get('https://fbref.com/en/comps/20/passing/Bundesliga-Stats', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    $ = cheerio.load(passingRes.data);
    
    $('table#stats_passing tbody tr').each((i, el) => {
      if ($(el).hasClass('thead')) return;
      const name = $(el).find('td[data-stat="player"] a').text().trim();
      const team = $(el).find('td[data-stat="team"] a').text().trim();
      const passesCompleted = parseInt($(el).find('td[data-stat="passes_completed"]').text().trim()) || 0;
      const keyPasses = parseInt($(el).find('td[data-stat="assisted_shots"]').text().trim()) || 0;

      const key = `${name}-${team}`;
      if (playersMap.has(key)) {
        const p = playersMap.get(key);
        p.passes_completed = passesCompleted;
        p.key_passes = keyPasses;
      }
    });

    // 3. Fetch Defensive Stats (Tackles won, Interceptions)
    console.log('Fetching Defensive Stats...');
    const defenseRes = await axios.get('https://fbref.com/en/comps/20/defense/Bundesliga-Stats', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    $ = cheerio.load(defenseRes.data);
    
    $('table#stats_defense tbody tr').each((i, el) => {
      if ($(el).hasClass('thead')) return;
      const name = $(el).find('td[data-stat="player"] a').text().trim();
      const team = $(el).find('td[data-stat="team"] a').text().trim();
      const tacklesWon = parseInt($(el).find('td[data-stat="tackles_won"]').text().trim()) || 0;
      const interceptions = parseInt($(el).find('td[data-stat="interceptions"]').text().trim()) || 0;
      const errors = parseInt($(el).find('td[data-stat="errors"]').text().trim()) || 0;

      const key = `${name}-${team}`;
      if (playersMap.has(key)) {
        const p = playersMap.get(key);
        p.tackles_won = tacklesWon;
        p.interceptions = interceptions;
        p.errors_leading_to_shot = errors;
      }
    });

    // Calculate Kickbase points for each player based on the matrix
    console.log('Calculating Kickbase Points...');
    const finalPlayersList = [];

    for (const [key, p] of playersMap.entries()) {
      let points = 0;

      // Base: Startelf / minutes bonus
      if (p.matches_played > 0) {
        points += p.matches_played * 5; // Startelf bonus estimation
        points += Math.round(p.minutes_played * 1.5); // Minutes points (+1/min approx)
      }

      // Goals points (position dependent)
      const goalVal = KICKBASE_GOAL_POINTS[p.position] || 80;
      points += p.goals * goalVal;

      // Assists points (position dependent)
      const assistVal = KICKBASE_ASSIST_POINTS[p.position] || 35;
      points += p.assists * assistVal;

      // Key passes (+5 pts)
      points += p.key_passes * 5;

      // Passes completed (+1 pt per precise long pass / pass in target third estimation)
      points += Math.round(p.passes_completed * 0.15); // estimation factor

      // Tackles won (+5 pts)
      points += p.tackles_won * 5;

      // Interceptions (+1 pt for intercept, +3 inside box estimation)
      points += p.interceptions * 2;

      // Cards
      points += p.yellow_cards * -10;
      points += p.red_cards * -75;

      // Errors before shot (-15 pts)
      points += p.errors_leading_to_shot * -15;

      // Average points per match
      p.kickbase_points = p.matches_played > 0 ? Math.round(points / p.matches_played) : 0;
      
      // Filter out players with zero stats
      if (p.minutes_played > 100) {
        finalPlayersList.push({
          id: `scraped-${p.team.toLowerCase().replace(/[^a-z]/g, '')}-${p.name.toLowerCase().replace(/[^a-z]/g, '')}`,
          name: p.name,
          team: p.team,
          position: p.position,
          price: p.position === 'GK' ? 9500000 : p.position === 'DEF' ? 14000000 : p.position === 'MID' ? 18000000 : 22000000,
          xp: Math.round(p.kickbase_points * 1.05),
          form: 1.0,
          goals: p.goals,
          assists: p.assists,
          matches_played: p.matches_played,
          kickbase_points: p.kickbase_points,
          opponent: 'TBD',
          isHome: true,
          avatarColor: p.position === 'GK' ? 'from-blue-600 to-black' : p.position === 'DEF' ? 'from-emerald-700 to-black' : p.position === 'MID' ? 'from-purple-600 to-black' : 'from-red-600 to-black',
          stats: {
            key_passes: p.key_passes,
            passes_completed: p.passes_completed,
            tackles_won: p.tackles_won,
            interceptions: p.interceptions,
            errors_leading_to_shot: p.errors_leading_to_shot
          }
        });
      }
    }

    // Write to JSON output file
    const outputPath = path.join(__dirname, '../public/squads_players.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalPlayersList, null, 2), 'utf-8');
    
    console.log(`Scraper completed successfully! Scraped ${finalPlayersList.length} players.`);
    console.log(`Data saved to: ${outputPath}`);

  } catch (error) {
    console.error('Scraper failed with error:', error.message);
  }
}

scrapeFBref();
