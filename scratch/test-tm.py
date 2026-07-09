import requests
from bs4 import BeautifulSoup

url = "https://www.transfermarkt.de/fc-bayern-munchen/kader/verein/27/saison_id/2025"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
try:
    r = requests.get(url, headers=headers)
    print("Status Code:", r.status_code)
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, 'html.parser')
        print("Title:", soup.title.string if soup.title else "No Title")
        table = soup.find('table', class_='items')
        if table:
            print("Success! Found squad table.")
        else:
            print("Table not found in HTML.")
    else:
        print("Failed. Snippet:", r.text[:300])
except Exception as e:
    print("Error:", e)
