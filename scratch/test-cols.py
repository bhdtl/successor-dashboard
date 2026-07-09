import soccerdata as sd
fbref = sd.FBref(leagues='GER-Bundesliga', seasons='2425')
df = fbref.read_player_season_stats(stat_type="standard")
print("Columns:", df.columns.tolist())
