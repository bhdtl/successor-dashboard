import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env!")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# Load detailed characters
scaffold_dir = "C:/Users/phina/.gemini/antigravity/scratch/personal-dashboard/scraper"
detailed_path = os.path.join(scaffold_dir, "characters_detailed.json")

if not os.path.exists(detailed_path):
    print(f"Error: Detailed characters JSON file not found at {detailed_path}!")
    exit(1)

with open(detailed_path, "r", encoding="utf-8") as f:
    cards = json.load(f)

print(f"Loaded {len(cards)} characters to push to Supabase.")

# Columns list for table public.dokkan_characters
columns = [
    "id", "name", "subname", "rarity", "element", "character_id", 
    "card_unique_info_id", "leader_skill", "passive_skill_name", 
    "passive_skill_description", "active_skill_name", "active_skill_effect", 
    "active_skill_condition", "category_ids", "link_ids", 
    "max_hp", "max_atk", "max_def", "base_hp", "base_atk", "base_def", 
    "rainbow_hp", "rainbow_atk", "rainbow_def", "tag"
]

formatted_cards = []
for card in cards:
    formatted = {}
    for col in columns:
        val = card.get(col)
        # Ensure category_ids and link_ids are arrays of non-null ints
        if col in ["category_ids", "link_ids"]:
            if val is None or not isinstance(val, list):
                val = []
            else:
                val = [int(i) for i in val if i is not None]
        # Ensure correct type for other fields
        elif col in ["id", "rarity", "element", "character_id", "card_unique_info_id", 
                     "max_hp", "max_atk", "max_def", "base_hp", "base_atk", "base_def", 
                     "rainbow_hp", "rainbow_atk", "rainbow_def"]:
            if val is not None:
                try:
                    val = int(val)
                except ValueError:
                    val = None
        formatted[col] = val
    formatted_cards.append(formatted)

# Push in batches of 100
batch_size = 100
total_pushed = 0

print("Pushing characters to Supabase...")
for i in range(0, len(formatted_cards), batch_size):
    batch = formatted_cards[i:i+batch_size]
    try:
        res = supabase.table("dokkan_characters").upsert(batch).execute()
        total_pushed += len(batch)
        print(f"  Pushed batch {i//batch_size + 1}/{len(formatted_cards)//batch_size + 1} ({len(batch)} cards). Total pushed: {total_pushed}")
    except Exception as e:
        print(f"Error pushing batch starting at index {i}: {e}")
        # Print a sample card payload for debugging
        print(f"Sample card: {json.dumps(batch[0], indent=2)}")
        break

print(f"\nFinished pushing characters! Total characters processed: {total_pushed}")
