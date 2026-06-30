import requests
import json
import os

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# Directories
src_dir = "C:/Users/phina/.gemini/antigravity/scratch/personal-dashboard/src/data"
os.makedirs(src_dir, exist_ok=True)

# 1. Fetch Categories
print("Fetching categories...")
r = requests.get("https://api.dokkandb.com/api/categories?search_term=", headers=headers)
if r.status_code == 200:
    categories = r.json()
    # Save to src/data/categories.json
    with open(os.path.join(src_dir, "categories.json"), "w", encoding="utf-8") as f:
        json.dump(categories, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(categories)} categories to categories.json!")

# 2. Fetch Link Skills
print("Fetching link skills...")
r = requests.get("https://api.dokkandb.com/api/links?search_term=", headers=headers)
if r.status_code == 200:
    links = r.json()
    # Save to src/data/links.json
    with open(os.path.join(src_dir, "links.json"), "w", encoding="utf-8") as f:
        json.dump(links, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(links)} link skills to links.json!")
