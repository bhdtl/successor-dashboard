import soccerdata as sd
import sys

print("Initializing FBref scraper via soccerdata...")
try:
    # Fetch Bundesliga stats for the 2024/2025 season
    fbref = sd.FBref(leagues='GER-Bundesliga', seasons='2425')
    print("Reading player season stats...")
    df = fbref.read_player_season_stats(stat_type="standard")
    print("Success! Head of the DataFrame:")
    print(df.head())
except Exception as e:
    print("Failed to fetch data:", str(e), file=sys.stderr)
