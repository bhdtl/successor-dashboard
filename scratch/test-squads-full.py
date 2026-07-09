import soccerdata as sd
import pandas as pd
import sys

print("Fetching 1. Bundesliga stats...")
try:
    fbref_1 = sd.FBref(leagues='GER-Bundesliga', seasons='2425')
    df_1 = fbref_1.read_player_season_stats(stat_type="standard")
    print(f"Scraped {len(df_1)} players from 1. Bundesliga.")
except Exception as e:
    print("Failed to fetch 1. Bundesliga:", str(e))
    df_1 = pd.DataFrame()

print("\nFetching 2. Bundesliga stats...")
try:
    fbref_2 = sd.FBref(leagues='GER-2.Bundesliga', seasons='2425')
    df_2 = fbref_2.read_player_season_stats(stat_type="standard")
    print(f"Scraped {len(df_2)} players from 2. Bundesliga.")
except Exception as e:
    print("Failed to fetch 2. Bundesliga:", str(e))
    df_2 = pd.DataFrame()

if not df_1.empty or not df_2.empty:
    df_all = pd.concat([df_1, df_2])
    print(f"\nTotal players loaded: {len(df_all)}")
    
    # Print distinct teams
    teams = df_all.reset_index()['team'].unique()
    print("\nDistinct Teams found in FBref:")
    print(sorted(list(teams)))
else:
    print("No data retrieved.")
