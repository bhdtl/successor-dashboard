import soccerdata as sd
import pandas as pd
import json
import re
import os
import random

print("Loading local rosters.ts cache to extract Elversberg players...")
elversberg_players = []
try:
    rosters_path = "src/data/rosters.ts"
    if os.path.exists(rosters_path):
        with open(rosters_path, "r", encoding="utf-8") as f:
            content = f.read()
            # Extract JSON array
            match = re.search(r"BUNDESLIGA_ROSTERS: BundesligaRosterPlayer\[\] = (\[.*\]);", content, re.DOTALL)
            if match:
                all_cached = json.loads(match.group(1))
                elversberg_players = [p for p in all_cached if p["team"] == "SV Elversberg"]
                print(f"Loaded {len(elversberg_players)} Elversberg players from local cache.")
except Exception as e:
    print("Could not load Elversberg cache:", e)

# 18 clubs matching FDR Planner names
FDR_CLUBS = {
    'Bayern Munich': 'FC Bayern München',
    'Bayer Leverkusen': 'Bayer 04 Leverkusen',
    'Dortmund': 'Borussia Dortmund',
    'RB Leipzig': 'RB Leipzig',
    'Stuttgart': 'VfB Stuttgart',
    'Eintracht Frankfurt': 'Eintracht Frankfurt',
    'Hoffenheim': 'TSG Hoffenheim',
    'Freiburg': 'Sport-Club Freiburg',
    'Werder Bremen': 'SV Werder Bremen',
    'M\'Gladbach': 'Borussia Mönchengladbach',
    'Gladbach': 'Borussia Mönchengladbach',
    'Monchengladbach': 'Borussia Mönchengladbach',
    'Union Berlin': '1. FC Union Berlin',
    'Augsburg': 'FC Augsburg',
    'Mainz 05': '1. FSV Mainz 05',
    'Hamburger SV': 'Hamburger SV',
    'Schalke 04': 'FC Schalke 04',
    'Paderborn': 'SC Paderborn 07',
    'Koln': '1. FC Köln',
    'Köln': '1. FC Köln'
}

AVATAR_COLORS = {
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
}

CLUB_ABBR = {
    'FC Bayern München': 'FCB',
    'Bayer 04 Leverkusen': 'B04',
    'Borussia Dortmund': 'BVB',
    'RB Leipzig': 'RBL',
    'VfB Stuttgart': 'VFB',
    'Eintracht Frankfurt': 'SGE',
    'TSG Hoffenheim': 'TSG',
    'Sport-Club Freiburg': 'SCF',
    'SV Werder Bremen': 'SVW',
    'Borussia Mönchengladbach': 'BMG',
    '1. FC Union Berlin': 'FCU',
    'FC Augsburg': 'FCA',
    '1. FSV Mainz 05': 'M05',
    'Hamburger SV': 'HSV',
    'FC Schalke 04': 'S04',
    'SC Paderborn 07': 'SCP',
    '1. FC Köln': 'KOE'
}

def map_position(pos_str):
    if not pos_str or not isinstance(pos_str, str):
        return 'MID'
    first = pos_str.split(',')[0].strip().upper()
    if 'GK' in first: return 'GK'
    if 'DF' in first: return 'DEF'
    if 'MF' in first: return 'MID'
    if 'FW' in first: return 'FWD'
    return 'MID'

def calculate_price(position, goals, assists, matches_played, minutes):
    base = 2000000
    if position == 'GK': base = 3000000
    elif position == 'DEF': base = 4000000
    elif position == 'MID': base = 6000000
    elif position == 'FWD': base = 8000000
    
    base += goals * 2500000
    base += assists * 1500000
    base += matches_played * 200000
    base += minutes * 1000
    
    return int(min(50000000, max(1000000, base)))

def calculate_kickbase(position, goals, assists, matches_played, minutes, cards_y, cards_r):
    if matches_played == 0:
        return 0
    # Minutes appearance bonus
    points = minutes * 1.2
    
    # Goals
    if position == 'GK': points += goals * 120
    elif position == 'DEF': points += goals * 100
    elif position == 'MID': points += goals * 90
    elif position == 'FWD': points += goals * 80
    
    # Assists
    points += assists * 35
    
    # Cards
    points -= cards_y * 10
    points -= cards_r * 75
    
    # Add random factor to simulate pass accuracy and defensive actions
    points += random.randint(20, 80) * matches_played
    
    avg = int(points / matches_played)
    return max(15, avg)

print("\nInitializing FBref scraper for 5 seasons...")
fbref = sd.FBref(leagues='GER-Bundesliga', seasons=['2425', '2324', '2223', '1920', '1718'])

print("Reading standard player stats (this may use cached data or fetch live)...")
df = fbref.read_player_season_stats(stat_type="standard")
df = df.reset_index()

# Flatten multi-index columns
df.columns = [col[0] if col[1] == '' else f"{col[0]}_{col[1]}" for col in df.columns]

players = []

# Iterate through records
for idx, row in df.iterrows():
    raw_team = row['team']
    # Match against our 18 FDR clubs
    team_name = FDR_CLUBS.get(raw_team)
    if not team_name:
        continue # Skip other Bundesliga teams (like Darmstadt, Heidenheim, etc.)
        
    abbr = CLUB_ABBR[team_name]
    player_name = row['player']
    
    # Extract values from flattened columns
    matches = int(row['Playing Time_MP'])
    minutes = int(row['Playing Time_Min'])
    goals = int(row['Performance_Gls'])
    assists = int(row['Performance_Ast'])
    cards_y = int(row['Performance_CrdY'])
    cards_r = int(row['Performance_CrdR'])
    pos_str = row['pos']
    season = row['season']
    
    if matches == 0 or not pos_str:
        continue
        
    position = map_position(pos_str)
    price = calculate_price(position, goals, assists, matches, minutes)
    kb_points = calculate_kickbase(position, goals, assists, matches, minutes, cards_y, cards_r)
    xp = int(kb_points * 1.12 + (goals * 10))
    
    player_id = f"player-{abbr.lower()}-{player_name.lower().replace(' ', '-')}"
    player_id = re.sub(r'[^a-z0-9\-]', '', player_id)
    
    players.append({
        'id': player_id,
        'name': player_name,
        'position': position,
        'price': price,
        'xp': xp,
        'form': float(round(1.0 + (goals * 0.1) + (assists * 0.05), 1)),
        'team': team_name,
        'opponent': 'TBD',
        'isHome': True,
        'avatarColor': AVATAR_COLORS[abbr],
        'kickbase_points': kb_points,
        'goals': goals,
        'assists': assists,
        'matches_played': matches,
        'season': season, # Keep reference to filter later
        'stats': {
            'key_passes': int(assists * 2 + round(matches * 0.7)),
            'passes_completed': int(matches * 30 + round(minutes * 0.4)),
            'tackles_won': int(matches * 1 + (25 if position == 'DEF' else 0)),
            'interceptions': int(matches * 1 + (15 if position == 'DEF' else 0)),
            'errors_leading_to_shot': int(random.randint(0, 2))
        }
    })

print(f"Scraped {len(players)} total player-season rows.")

# Group by player name to keep their most recent active season stats
# For example, if we have stats for a player in 2425, we discard older seasons
players_df = pd.DataFrame(players)
# Sort by player name and season descending so that the most recent season is first
players_df = players_df.sort_values(by=['name', 'season'], ascending=[True, False])
# Drop duplicates based on player name to keep the latest season
players_df = players_df.drop_duplicates(subset=['name'], keep='first')

final_players = players_df.to_dict('records')
print(f"Filtered down to {len(final_players)} unique players after keeping most recent season stats.")

# Add Elversberg players
final_players.extend(elversberg_players)
print(f"Combined with {len(elversberg_players)} Elversberg players. Total: {len(final_players)}")

# Format as TypeScript output for rosters.ts
code_content = f"""export interface PlayerStats {{
  key_passes: number;
  passes_completed: number;
  tackles_won: number;
  interceptions: number;
  errors_leading_to_shot: number;
}}

export interface BundesligaRosterPlayer {{
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
  season?: string;
  stats: PlayerStats;
}}

export const BUNDESLIGA_ROSTERS: BundesligaRosterPlayer[] = {json.dumps(final_players, indent=2)};
"""

output_path = "src/data/rosters.ts"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(code_content)
    
print(f"Successfully wrote rosters database to {output_path}")
