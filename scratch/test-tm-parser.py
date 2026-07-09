import requests
from bs4 import BeautifulSoup

url = "https://www.transfermarkt.de/fc-bayern-munchen/kader/verein/27/saison_id/2025"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
try:
    r = requests.get(url, headers=headers)
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, 'html.parser')
        table = soup.find('table', class_='items')
        if table:
            rows = table.find_all('tr', class_=['odd', 'even'])
            print(f"Total rows found: {len(rows)}")
            
            # Print details of the first 3 rows to inspect structure
            for idx, row in enumerate(rows[:3]):
                print(f"\n--- Row {idx} ---")
                tds = row.find_all('td')
                for td_idx, td in enumerate(tds):
                    # Strip whitespace and print content length/text snippet
                    txt = td.get_text().strip()
                    print(f"Cell {td_idx}: text=[{txt}], class={td.get('class')}")
                    # If cell has links, print link text and hrefs
                    links = td.find_all('a')
                    if links:
                        print(f"   Links: {[(l.get_text().strip(), l.get('href')) for l in links]}")
        else:
            print("Table class='items' not found.")
    else:
        print(f"Failed. Status: {r.status_code}")
except Exception as e:
    print("Error:", e)
