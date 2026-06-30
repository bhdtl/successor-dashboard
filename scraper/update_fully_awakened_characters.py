import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from parent directory
env_path = r"C:\Users\phina\.gemini\antigravity\scratch\personal-dashboard\.env"
load_dotenv(dotenv_path=env_path)

supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    # Fallback to anon key if service role is not defined (service role is preferred for writes)
    supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("Error: Supabase URL or Key not found in .env!")
    exit(1)

sb: Client = create_client(supabase_url, supabase_key)

scaffold_dir = r"C:\Users\phina\.gemini\antigravity\scratch\personal-dashboard\scraper"
detailed_path = os.path.join(scaffold_dir, "characters_detailed.json")
fyi_path = os.path.join(scaffold_dir, "fyi_characters.json")

with open(detailed_path, "r", encoding="utf-8") as f:
    detailed_cards = json.load(f)

with open(fyi_path, "r", encoding="utf-8") as f:
    fyi_cards = json.load(f)

print(f"Loaded {len(detailed_cards)} detailed cards and {len(fyi_cards)} fyi cards.")

# Create map of fyi cards by ID
fyi_map = {c["id"]: c for c in fyi_cards}

columns = [
    "id", "name", "subname", "rarity", "element", "character_id", 
    "card_unique_info_id", "leader_skill", "passive_skill_name", 
    "passive_skill_description", "active_skill_name", "active_skill_effect", 
    "active_skill_condition", "category_ids", "link_ids", 
    "max_hp", "max_atk", "max_def", "base_hp", "base_atk", "base_def", 
    "rainbow_hp", "rainbow_atk", "rainbow_def", "tag"
]

updated_cards = []

for card in detailed_cards:
    cid = card["id"]
    
    # 1. Start with base detailed card fields
    # Ensure category_ids and link_ids are integer arrays
    cat_ids = card.get("category_ids") or []
    cat_ids = [int(x) for x in cat_ids if x is not None]
    
    link_ids = card.get("link_ids") or []
    link_ids = [int(x) for x in link_ids if x is not None]
    
    # Initialize basic stats to None
    base_hp = base_atk = base_def = None
    max_hp = max_atk = max_def = None
    rainbow_hp = rainbow_atk = rainbow_def = None
    
    # 2. Match with fyi_characters stats
    fyi_match = fyi_map.get(cid)
    has_eza = False
    
    if fyi_match:
        has_eza = fyi_match.get("has_eza") is True
        stats = fyi_match.get("stats") or {}
        hp_stats = stats.get("hp") or {}
        atk_stats = stats.get("atk") or {}
        def_stats = stats.get("def") or {}
        
        # Base stats
        base_hp = hp_stats.get("base")
        base_atk = atk_stats.get("base")
        base_def = def_stats.get("base")
        
        # Max stats (EZA if exists, else max)
        if has_eza:
            max_hp = hp_stats.get("eza") or hp_stats.get("max")
            max_atk = atk_stats.get("eza") or atk_stats.get("max")
            max_def = def_stats.get("eza") or def_stats.get("max")
        else:
            max_hp = hp_stats.get("max")
            max_atk = atk_stats.get("max")
            max_def = def_stats.get("max")
            
        # Rainbow stats
        hp_boost = atk_boost = def_boost = 0
        h_pot = fyi_match.get("hidden_potential")
        if h_pot:
            hp_boost = h_pot.get("hp") or 0
            atk_boost = h_pot.get("atk") or 0
            def_boost = h_pot.get("def") or 0
        else:
            # Standard hidden potential grid boost fallback values
            rarity = card.get("rarity")
            if rarity == 5: # LR
                hp_boost = atk_boost = def_boost = 5000
            elif rarity == 4 or rarity == 3: # UR / SSR
                elem = card.get("element") or 10
                type_idx = elem % 10
                if type_idx in [0, 4]: # AGL, PHY
                    hp_boost, atk_boost, def_boost = 5400, 5000, 4600
                elif type_idx in [1, 2]: # TEQ, INT
                    hp_boost, atk_boost, def_boost = 4600, 5400, 5000
                elif type_idx == 3: # STR
                    hp_boost, atk_boost, def_boost = 5000, 4600, 5400
                    
        if max_hp: rainbow_hp = max_hp + hp_boost
        if max_atk: rainbow_atk = max_atk + atk_boost
        if max_def: rainbow_def = max_def + def_boost
        
    # 3. Fully Awakened (EZA) Overrides for skills
    leader_skill = card.get("leader_skill")
    passive_name = card.get("passive_skill_name")
    passive_desc = card.get("passive_skill_description")
    
    # Check for EZA versions of skills
    eza_lead = card.get("eza_leader_skill")
    eza_pass_name = card.get("eza_passive_skill_name")
    eza_pass_desc = card.get("eza_passive_skill_description")
    
    if eza_lead:
        leader_skill = eza_lead
    if eza_pass_name:
        passive_name = eza_pass_name
    if eza_pass_desc:
        passive_desc = eza_pass_desc
        
    # Clean active skill info
    active_name = card.get("active_skill_name")
    active_effect = card.get("active_skill_effect")
    active_cond = card.get("active_skill_condition")
    
    # Construct base keywords search tag
    base_keywords = []
    awk_data = card.get("awakening_data") or []
    for stage in awk_data:
        stage_id = stage.get("id")
        if stage_id and stage_id != cid:
            base_keywords.append(str(stage_id))
            if stage.get("name"):
                base_keywords.append(stage.get("name"))
            if stage.get("subname"):
                base_keywords.append(stage.get("subname"))
                
    orig_tag = card.get("tag") or "Summonable"
    if base_keywords:
        tag_value = f"{orig_tag} | Base: {' / '.join(base_keywords)}"
    else:
        tag_value = orig_tag

    payload = {
        "id": cid,
        "name": card.get("name"),
        "subname": card.get("subname"),
        "rarity": card.get("rarity"),
        "element": card.get("element"),
        "character_id": card.get("character_id"),
        "card_unique_info_id": card.get("card_unique_info_id"),
        "leader_skill": leader_skill,
        "passive_skill_name": passive_name,
        "passive_skill_description": passive_desc,
        "active_skill_name": active_name,
        "active_skill_effect": active_effect,
        "active_skill_condition": active_cond,
        "category_ids": cat_ids,
        "link_ids": link_ids,
        "max_hp": max_hp,
        "max_atk": max_atk,
        "max_def": max_def,
        "base_hp": base_hp,
        "base_atk": base_atk,
        "base_def": base_def,
        "rainbow_hp": rainbow_hp,
        "rainbow_atk": rainbow_atk,
        "rainbow_def": rainbow_def,
        "tag": tag_value
    }
    
    updated_cards.append(payload)

# Batch upload to Supabase
batch_size = 100
total_updated = 0

print("Uploading fully awakened stats and override skills to public.dokkan_characters...")
for i in range(0, len(updated_cards), batch_size):
    batch = updated_cards[i:i+batch_size]
    try:
        sb.table("dokkan_characters").upsert(batch).execute()
        total_updated += len(batch)
        print(f"  Batch {i//batch_size + 1} processed ({len(batch)} cards). Total: {total_updated}")
    except Exception as e:
        print(f"Error upserting batch starting at index {i}: {e}")
        print("Sample payload:", json.dumps(batch[0], indent=2))
        break

print(f"\nAll character profiles successfully updated with fully awakened status! Total: {total_updated}")
