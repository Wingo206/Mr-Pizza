const path = require('path');
const fs = require('node:fs');
const superagent = require('superagent');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

let menuUrl = 'https://www.dominos.com/en/pages/order/menu#!/menu/category/viewall/';

let cachePath = __dirname + path.sep + 'cache'
if (!fs.existsSync(cachePath)) {
   fs.mkdirSync(cachePath)
}

/**
 * Fetches the parsed contents of a webpage from the url using superagent.
 * Caches the results in the cache/ directory so that we don't fetch redundantly.
 * Cache filenames are the same as the url but with slashes replaced with underscores.
 */
async function getHTML(url) {
   let filename = url.replaceAll('/', '_');
   let filepath = path.join(cachePath, filename);

   // check cache first
   // let cached = fs.existsSync(filepath);
   cached = false;
   let text;
   if (cached) {
      text = fs.readFileSync(filepath, 'utf8');
   } else {
      // if not in cache, fetch from the actual website

      // let resp = await superagent.get(url);
      // text = resp.text;

      const browser = await puppeteer.launch();
      // const browser = await puppeteer.launch({
      //    headless: false,
      //    env: {
      //       DISPLAY: ":10.0"
      //    }
      // })
      const page = await browser.newPage()
      await page.goto(url, {waitUntil: 'networkidle0'})
      await page.waitForSelector('div.media.media--category-tile')

      text = await page.content()
      await browser.close();

      // store the result in the cache for next time
      fs.writeFileSync(filepath, text);
   }
   return cheerio.load(text);
}

async function scrape() {
   console.log('scraping...')
   const $ = await getHTML(menuUrl);

   // get all the categories on the menu
   let test = $('div.media.media--category-tile')
      .find('a.qa-Pizza.grid.c-order-entree-qa-Pizza.grid')
      .text();
   console.log(test)



}


if (require.main === module) {
   scrape();
}
