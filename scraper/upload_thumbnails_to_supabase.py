import os
import json
import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env!")
    exit(1)

sb: Client = create_client(supabase_url, supabase_key)

bucket_name = "character-thumbnails"

# 1. Ensure bucket exists
try:
    sb.storage.create_bucket(bucket_name, options={"public": True})
    print(f"Created public bucket '{bucket_name}'")
except Exception as e:
    print(f"Bucket check/create log: {e}")

# 2. Get list of already uploaded files in bucket to avoid duplicate work
print("Fetching list of existing files from Supabase Storage...")
existing_files = set()
try:
    # Fetch list in pages/chunks if necessary, or just large limit
    # Supabase allows up to 1000 per list call. Let's do multiple calls to list all.
    offset = 0
    limit = 1000
    while True:
        res = sb.storage.from_(bucket_name).list(options={
            "limit": limit,
            "offset": offset,
            "sortBy": {"column": "name", "order": "asc"}
        })
        if not res:
            break
        names = [item['name'] for item in res]
        existing_files.update(names)
        if len(names) < limit:
            break
        offset += limit
    print(f"Found {len(existing_files)} files already in the bucket.")
except Exception as e:
    print(f"Could not list existing files: {e}. Will proceed anyway.")

# Load detailed characters
scaffold_dir = "C:/Users/phina/.gemini/antigravity/scratch/personal-dashboard/scraper"
detailed_path = os.path.join(scaffold_dir, "characters_detailed.json")

with open(detailed_path, "r", encoding="utf-8") as f:
    cards = json.load(f)

card_ids = sorted(list(set([int(card["id"]) for card in cards])))
print(f"Found {len(card_ids)} unique card IDs to process.")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def process_card(cid):
    filename = f"card_{cid}_thumb.png"
    
    # Skip if already exists in storage
    if filename in existing_files:
        return cid, "Already exists"
        
    url = f"https://www.dokkandb.com/assets/character/thumb/{filename}"
    
    # Retry loop with backoff for robustness
    for attempt in range(4):
        try:
            # Download image
            r = requests.get(url, headers=headers, timeout=12)
            if r.status_code == 404:
                return cid, "Not found (404)"
            elif r.status_code != 200:
                time.sleep(2 ** attempt)
                continue
            
            # Upload to Supabase Storage
            sb.storage.from_(bucket_name).upload(
                path=filename,
                file=r.content,
                file_options={"content-type": "image/png"}
            )
            # Polite delay to prevent rate limits
            time.sleep(0.3)
            return cid, "Uploaded"
        except Exception as e:
            err_msg = str(e)
            if "already exists" in err_msg or "Duplicate" in err_msg or "409" in err_msg:
                return cid, "Already exists"
            time.sleep(2 ** attempt)
    
    return cid, "Failed after retries"

# Run with ThreadPoolExecutor using fewer threads (3) to avoid triggering DDoS block
print("Starting upload process using 3 threads (polite rate)...")
uploaded_count = 0
exists_count = 0
failed_count = 0

with ThreadPoolExecutor(max_workers=3) as executor:
    futures = {executor.submit(process_card, cid): cid for cid in card_ids}
    for i, future in enumerate(as_completed(futures)):
        cid, status = future.result()
        if status == "Uploaded":
            uploaded_count += 1
            print(f"Uploaded: card_{cid}_thumb.png")
        elif status == "Already exists":
            exists_count += 1
        else:
            failed_count += 1
            print(f"Failed card {cid}: {status}")
        
        if (i + 1) % 100 == 0:
            print(f"Progress: {i + 1}/{len(card_ids)}... Uploaded: {uploaded_count}, Existing: {exists_count}, Failed: {failed_count}")

print(f"Finished! Uploaded: {uploaded_count}, Existing: {exists_count}, Failed: {failed_count}")
