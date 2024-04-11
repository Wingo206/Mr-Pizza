const path = require('path');
const fs = require('node:fs');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// Set this to true to view the browser in non-headless mode
const DEBUG = true;


let cachePath = __dirname + path.sep + 'cache'
if (!fs.existsSync(cachePath)) {
   fs.mkdirSync(cachePath)
}

function delay(time) {
   return new Promise(function (resolve) {
      setTimeout(resolve, time)
   });
}

/**
 * adds an entry to the cache
 */
async function saveToCache(filepath, text) {
   fs.writeFileSync(path.join(cachePath, filepath), text);
}

/**
 * loads an entry from the cache
 */
async function readFromCache(filepath) {
   return fs.readFileSync(path.join(cachePath, filepath), 'utf8');
}

/**
 * Opens the Dominos menu and creates a delivery order
 * returns a page with the delivery set up
 */
async function setupDeliveryOrder(browser) {
   let menuUrl = 'https://www.dominos.com/en/pages/order/menu#!/menu/category/viewall/';
   const page = await browser.newPage()
   await page.goto(menuUrl, {waitUntil: 'networkidle0'})
   await delay(1000);

   // start a delivery order
   console.log('starting order delivery')
   await page.waitForSelector('[data-quid="start-your-order-delivery"]')
   await page.click('[data-quid="start-your-order-delivery"]')

   // input the form data
   console.log('inputting delivery information')
   await page.waitForSelector('#Street');
   await page.type('#Street', '604 Bartholomew Rd');
   await page.waitForSelector('#PostalCode');
   await page.type('#PostalCode', '08854');
   await page.waitForSelector('#City');
   await page.type('#City', 'Piscataway');
   await page.waitForSelector('#Region');
   await page.select('#Region', 'NJ');
   await page.waitForSelector('button[type="submit"]');
   await page.click('button[type="submit"]');

   // set order timing, if too late
   console.log('opening calendar')
   await page.waitForSelector('[name="Future_Date"]');
   await page.click('[name="Future_Date"]');
   await delay(100);
   await page.click('[name="Future_Date"]');
   console.log('selecting date')
   await page.waitForSelector('td.selectable_day');
   await page.click('td.selectable_day');
   console.log('selecting time dropdown')
   await page.waitForSelector('.select--future-time');
   await delay(1000);
   await page.select('.select--future-time', '23:00:00');
   console.log('submitting future time')
   await page.waitForSelector('button[type="submit"]');
   await page.click('button[type="submit"]');

   console.log('Delivery order started successfully');
   return page;
}

/**
 * Takes in a page with delivery order set up,
 * goes to the menu category and adds all the items to the cart,
 * then dumps the html contents into a file for analysis.
 */
async function scrapeNonCustomizable(page, category) {
   let catDir = category.replaceAll(' ', '_');
   let categoryCachePath = path.join(cachePath, catDir);
   if (!fs.existsSync(categoryCachePath)) {
      fs.mkdirSync(categoryCachePath)
   }


   // click the category button
   console.log('clicking on category button');
   // Find the h2 element with the specified text using XPath

   await page.waitForSelector(`h2[data-quid="${'entree-title-breadandovenbakeddips'}"]`)
   await page.click(`h2[data-quid="${'entree-title-breadandovenbakeddips'}"]`)



   // wait for menu to load
   console.log('waiting for categories');
   await page.waitForSelector('h2.card__title--main');
   await saveToCache(category, await page.content());
   let itemsInfo = await processCategoryHTML(category);

   // add each item to the cart
   console.log('adding all items to cart');
   for (let i = 0; i < itemsInfo.length; i++) {
      let curItemInfo = itemsInfo[i];
      console.log('adding ' + curItemInfo.itemName);
      let orderSelector = `a[data-quid="${curItemInfo.orderButtonDataQuid}"]`
      await page.waitForSelector(orderSelector);
      await page.click(orderSelector);
      let addToOrder = '#product-add-btn';
      await page.waitForSelector(addToOrder);
      await page.click(addToOrder);
      await page.waitForSelector(addToOrder, {hidden: true});
   }

   // checkout
   await page.waitForSelector('.c-order-buttonCheckout-text');
   await page.click('.c-order-buttonCheckout-text');
   // if "you might also enjoy" shows up
   try {
      await page.waitForSelector('[data-quid="overlay-no-thanks"]', {
         timeout: 5000
      });
      await page.click('[data-quid="overlay-no-thanks"]');
   } catch (e) {
      console.log('you might enjoy popup not found.')
   }
   // wait for the cart page
   await page.waitForSelector('[data-quid="cart-title"]');
   await delay(1000);

   // dump the contents into a file
   await saveToCache(category + '_cart', await page.content());

}

async function processCategoryHTML(category) {
   text = await readFromCache(category)
   const $page = cheerio.load(text);

   // get sections and item names
   console.log('Getting category item names')
   // let sectionNames = $page('section.card.category-subcomponent')
   let items = [];
   $page('h2.card__title--main').parent().parent().parent()
      .each((i, e) => {
         $page(e).find('h3.media__title')
            .each((i2, e2) => {
               items.push({
                  category: category,
                  sectionName: $page(e).find('h2.card__title--main').text().trim(),
                  itemName: $page(e2).find('a').text().trim(),
                  orderButtonDataQuid: $page(e2).prev().attr('data-quid'),
                  image: $page(e2).prev().prev().find('img').attr('src')
               })
            })
      });
   console.log(items)
   return items;
}

async function processNonCustomPrices(category) {
   let items = await processCategoryHTML(category);

   text = await readFromCache(category + '_cart');
   const $page = cheerio.load(text);

   $page('tr.order-summary__item')
      .each((i, e) => {
         let imgUrl = $page(e)
            .find('img').prop('src');
         let price = $page(e).find('.price').text().trim();
         for (let j = 0; j < items.length; j++) {
            if (imgUrl.includes(items[j].orderButtonDataQuid)) {
               items[j].price = price.slice(1);
               return;
            }
         }
         console.log('item in cart with name ' + itemName + ' not found')
      })
   console.log(items);
   console.log(items.map(i => i.itemName))
   return items;
}

/**
 * Fetches the contents of a webpage from the url using puppeteer.
 * Caches the results in the cache/ directory so that we don't fetch redundantly.
 * Cache filenames are the same as the url but with slashes replaced with underscores.
 */
const nonCustomizableCategories = ['Breads & Oven-Baked Dips', 'Loaded Tots', 'Chicken',
   'Desserts', 'Pastas', 'Oven Baked Sandwiches', 'Salads', 'Drinks', 'Extras'];
async function scrapeData() {
   const browser = await puppeteer.launch({
      headless: !DEBUG,
   })
   let page = await setupDeliveryOrder(browser);
   await scrapeNonCustomizable(page, nonCustomizableCategories[0]);

}


/**
 * Loads the cached html page data from the cache and returns a loaded cheerio object.
 */
async function getHTML(url) {

}

async function scrape() {
   console.log('scraping...')
   await scrapeData();
   // const $ = await getHTML(menuUrl);

   // // get all the categories on the menu
   // let test = $('div.media.media--category-tile')
   //    .find('a.qa-Pizza.grid.c-order-entree-qa-Pizza.grid')
   //    .text();
   // console.log(test)



}


if (require.main === module) {
   // scrape();
   // processCategoryHTML(nonCustomizableCategories[0]);

   processNonCustomPrices(nonCustomizableCategories[0]);
}
