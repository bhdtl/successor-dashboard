import requests
import json
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

all_cards = []
chunk = 1
chunk_size = 1000

print("Starting to fetch Dokkan Battle characters from DokkanDB API...")

while True:
    url = f"https://api.dokkandb.com/api/cards-catalog-with-transformations?chunk={chunk}&chunk_size={chunk_size}"
    print(f"Fetching chunk {chunk} ...")
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code != 200:
            print(f"Error fetching chunk {chunk}: Status {r.status_code}")
            break
            
        data = r.json()
        if not data or len(data) == 0:
            print(f"No more cards found. Finished at chunk {chunk-1}.")
            break
            
        all_cards.extend(data)
        print(f"  Added {len(data)} cards. Total so far: {len(all_cards)}")
        
        # Increment chunk
        chunk += 1
        # Polite delay
        time.sleep(1)
    except Exception as e:
        print(f"Exception on chunk {chunk}: {e}")
        break

# Save all catalog data
output_path = "C:/Users/phina/.gemini/antigravity/scratch/personal-dashboard/scraper/characters.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(all_cards, f, indent=2, ensure_ascii=False)

print(f"\nSuccessfully saved {len(all_cards)} characters to {output_path}!")
