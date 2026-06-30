import asyncio
import json
import httpx
import os

# Paths
scaffold_dir = "C:/Users/phina/.gemini/antigravity/scratch/personal-dashboard/scraper"
catalog_path = os.path.join(scaffold_dir, "characters.json")
output_path = os.path.join(scaffold_dir, "characters_detailed.json")
github_data_url = "https://raw.githubusercontent.com/MNprojects/DokkanAPI/main/data/DokkanCharacterData.json"

# Load catalog IDs
with open(catalog_path, "r", encoding="utf-8") as f:
    catalog_cards = json.load(f)

# Extract card IDs (filter out duplicates if any)
card_ids = sorted(list(set([card["id"] for card in catalog_cards])))
print(f"Loaded {len(catalog_cards)} catalog items. Unique IDs to fetch: {len(card_ids)}")

detailed_cards = {}
sem = asyncio.Semaphore(15)  # Limit concurrency to be nice to the server

async def fetch_card_details(client, card_id):
    async with sem:
        url = f"https://api.dokkandb.com/api/card?code={card_id}"
        for attempt in range(3):
            try:
                r = await client.get(url, timeout=10)
                if r.status_code == 200:
                    data = r.json()
                    if data and len(data) > 0:
                        detailed_cards[card_id] = data[0]
                    break
                elif r.status_code == 404:
                    # Some cards might not exist in the details API
                    break
            except Exception as e:
                if attempt == 2:
                    print(f"Error fetching card {card_id}: {e}")
                await asyncio.sleep(1)
        # Polite delay
        await asyncio.sleep(0.1)

async def main():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    # Step 1: Fetch individual card details from DokkanDB
    async with httpx.AsyncClient(headers=headers, limits=httpx.Limits(max_connections=20)) as client:
        tasks = [fetch_card_details(client, cid) for cid in card_ids]
        print("Fetching card details from DokkanDB API...")
        await asyncio.gather(*tasks)
        
    print(f"Fetched details for {len(detailed_cards)} cards.")
    
    # Step 2: Download GitHub dataset for stats merging
    print("Downloading GitHub character dataset...")
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(github_data_url)
            if r.status_code == 200:
                github_chars = r.json()
                print(f"Downloaded {len(github_chars)} characters from GitHub.")
            else:
                github_chars = []
                print(f"Failed to download GitHub data: Status {r.status_code}")
    except Exception as e:
        github_chars = []
        print(f"Error downloading GitHub data: {e}")
        
    # Map GitHub characters by name and title for easy merging
    github_map = {}
    for char in github_chars:
        # Standardize name/title matching
        key = f"{char.get('name', '').lower().strip()}|{char.get('title', '').lower().strip()}"
        github_map[key] = char
        
    # Step 3: Merge catalog data, detailed data, and stats
    merged_list = []
    merge_count = 0
    
    for catalog_card in catalog_cards:
        cid = catalog_card["id"]
        detail = detailed_cards.get(cid, {})
        
        # Merge catalog and detail keys
        merged = {**catalog_card, **detail}
        
        # Try to find matching stats in GitHub data
        name = merged.get("name", "")
        subname = merged.get("subname", "")
        match_key = f"{name.lower().strip()}|{subname.lower().strip()}"
        
        github_match = github_map.get(match_key)
        if github_match:
            merge_count += 1
            # Add stats
            merged["max_hp"] = github_match.get("maxLevelHP")
            merged["max_atk"] = github_match.get("maxLevelAttack")
            merged["max_def"] = github_match.get("maxDefence")
            merged["base_hp"] = github_match.get("baseHP")
            merged["base_atk"] = github_match.get("baseAttack")
            merged["base_def"] = github_match.get("baseDefence")
            merged["rainbow_hp"] = github_match.get("rainbowHP")
            merged["rainbow_atk"] = github_match.get("rainbowAttack")
            merged["rainbow_def"] = github_match.get("rainbowDefence")
            
        merged_list.append(merged)
        
    print(f"Merged stats for {merge_count} cards out of {len(merged_list)} total cards.")
    
    # Save the final merged dataset
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(merged_list, f, indent=2, ensure_ascii=False)
        
    print(f"Saved merged details and stats to {output_path}!")

if __name__ == "__main__":
    asyncio.run(main())
