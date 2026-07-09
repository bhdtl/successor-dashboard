const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://en.wikipedia.org/wiki/FC_Bayern_M%C3%BCnchen', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}).then(res => {
  const $ = cheerio.load(res.data);
  $('table.wikitable').each((i, table) => {
    const text = $(table).text();
    if (text.includes('Manuel Neuer') || text.includes('Harry Kane')) {
      console.log('--- Table Found ---');
      $(table).find('tr').each((j, tr) => {
        const tds = $(tr).find('td');
        if (tds.length >= 4) {
          const num = $(tds[0]).text().trim();
          const pos = $(tds[1]).text().trim();
          const nat = $(tds[2]).text().trim();
          const name = $(tds[3]).text().trim();
          console.log(`Player row: num=[${num}], pos=[${pos}], nat=[${nat}], name=[${name}]`);
        }
      });
    }
  });
}).catch(err => console.error(err.message));
