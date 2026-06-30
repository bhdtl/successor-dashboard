import json
import os

scaffold_dir = "C:/Users/phina/.gemini/antigravity/scratch/personal-dashboard/scraper"
detailed_path = os.path.join(scaffold_dir, "characters_detailed.json")

with open(detailed_path, "r", encoding="utf-8") as f:
    cards = json.load(f)

print(f"Total cards before deduplication: {len(cards)}")

# Deduplicate based on 'id'
seen_ids = set()
unique_cards = []
duplicates_count = 0

for card in cards:
    cid = card.get("id")
    if cid in seen_ids:
        duplicates_count += 1
        continue
    seen_ids.add(cid)
    unique_cards.append(card)

print(f"Found and removed {duplicates_count} duplicate cards.")
print(f"Total unique cards: {len(unique_cards)}")

with open(detailed_path, "w", encoding="utf-8") as f:
    json.dump(unique_cards, f, indent=2, ensure_ascii=False)

print("Saved deduplicated cards back to characters_detailed.json!")
