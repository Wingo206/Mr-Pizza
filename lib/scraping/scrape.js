const path = require('path');
const fs = require('node:fs');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

let cachePath = __dirname + path.sep + 'cache'
if (!fs.existsSync(cachePath)) {
   fs.mkdirSync(cachePath)
}
let dataPath = __dirname + path.sep + 'data'
if (!fs.existsSync(dataPath)) {
   fs.mkdirSync(dataPath)
}

function delay(time) {
   return new Promise(function (resolve) {
      setTimeout(resolve, time)
   });
}

/**
 * adds an entry to the cache
 */
function saveToCache(filepath, text) {
   let fullPath = path.join(cachePath, filepath);
   console.log('writing to cache: ' + fullPath);
   fs.writeFileSync(fullPath, text, 'utf8');
}

/**
 * saves an object in a JSON file in the data folder.
 */
function saveJSON(filepath, object) {
   let fullPath = path.join(dataPath, filepath);
   console.log('writing to data: ' + fullPath);
   fs.writeFileSync(fullPath, JSON.stringify(object));
}

/**
 * loads an entry from the cache
 */
function readFromCache(filepath) {
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
   // await delay(10000)
   try {
      await page.waitForSelector('[name="Future_Date"]', {
         hidden: false,
         timeout: 5000
      });
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
   } catch (e) {
      console.log('don\'t need to set future date')
   }

   console.log('Delivery order started successfully');
   return page;
}

/**
 * Waits for the page to load, then scrapes the menu and stores
 * in the cache.
 */
async function scrapeMenuCategories(page) {
   console.log('scraping menu categories')
   await page.waitForSelector('.media__image');
   saveToCache('menu.html', await page.content());
}

/**
 * Finds data-quid of each menu category
 */
function processMenuCategories() {
   text = readFromCache('menu.html')
   const $page = cheerio.load(text);
   let categoryIds = [];
   $page('h2.media__title')
      .each((i, e) => {
         categoryIds.push($page(e).prop('data-quid'))
      })
   // console.log(categoryIds);
   return categoryIds
}

/**
 * Takes in a page with delivery order set up,
 * goes to the menu category and adds all the items to the cart,
 * then dumps the html contents into a file for analysis.
 */
async function scrapeAddToCart(page, category) {

   // click the category button
   console.log('clicking on category button');
   // Find the h2 element with the specified text using XPath

   await page.waitForSelector(`h2[data-quid="${category}"]`)
   await page.click(`h2[data-quid="${category}"]`)



   // wait for menu to load
   console.log('waiting for data to load');
   await page.waitForSelector('.media__image');
   await delay(1000);
   saveToCache(category + '.html', await page.content());
   let itemsInfo = processCategoryHTML(category);

   // add each item to the cart
   console.log('adding all items to cart');
   for (let i = 0; i < itemsInfo.length; i++) {
      // for (let i = 0; i < 3; i++) {
      let curItemInfo = itemsInfo[i];
      console.log('adding ' + curItemInfo.itemName);
      let orderSelector = `a[data-quid="${curItemInfo.orderButtonDataQuid}"]`
      await page.waitForSelector(orderSelector);
      await page.click(orderSelector);
      // hack to skip popup for the extras
      if (category == 'entree-title-extras') {
         continue;
      }
      let addToOrder = '#product-add-btn';
      await page.waitForSelector(addToOrder);
      await page.click(addToOrder);
      await page.waitForSelector(addToOrder, {hidden: true});
   }

   // checkout
   while (true) {
      await page.waitForSelector('.c-order-buttonCheckout-text');
      await page.click('.c-order-buttonCheckout-text');
      // if the dumb drnks page shows up:
      try {
         await page.waitForSelector('[data-quid="F_COKE"]', {
            timeout: 3000
         });
         await page.waitForSelector('.c-order-buttonCheckout-text');
         await page.click('.c-order-buttonCheckout-text');
      } catch (e) {
         console.log('no drinks page')
      }
      // if "you might also enjoy" shows up
      try {
         await page.waitForSelector('[data-quid="overlay-no-thanks"]', {
            timeout: 3000
         });
         await page.click('[data-quid="overlay-no-thanks"]');
      } catch (e) {
         console.log('you might enjoy popup not found.')
      }
      // wait for the cart page
      try {
         await page.waitForSelector('[data-quid="cart-title"]', {timeout: 3000});
         break;
      } catch (e) {
         console.log('didn\'t pass checkout, trying again.');
      }
      await delay(1000);
   }

   // dump the contents into a file
   saveToCache(category + '_cart.html', await page.content());

}

/**
 * Reads information about the items in a category from the HTML
 * Gets the file from the cache
 */
function processCategoryHTML(category) {
   text = readFromCache(category + '.html')
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
                  description: $page(e2).parent().next().text().trim(),
                  orderButtonDataQuid: $page(e2).prev().attr('data-quid'),
                  image: $page(e2).prev().prev().find('img').attr('src')
               })
            })
      });
   if (items.length > 0) {
      return items;
   }
   // if empty, then there's no sections
   $page('h3.media__title')
      .each((i2, e2) => {
         items.push({
            category: category,
            sectionName: 'default',
            itemName: $page(e2).find('a').text().trim(),
            description: $page(e2).parent().next().text().trim(),
            orderButtonDataQuid: $page(e2).prev().attr('data-quid'),
            image: $page(e2).prev().prev().find('img').attr('src')
         })
      })
   // console.log(items)
   return items;
}

/**
 * Reads prices from the cart for all items from a category based on the HTML.
 * Gets the file from the cache
 */
function processCartItems(category) {
   let items = processCategoryHTML(category);

   text = readFromCache(category + '_cart.html');
   const $page = cheerio.load(text);

   $page('tr.order-summary__item')
      .each((i, e) => {
         let imgUrl = $page(e)
            .find('img').prop('src');
         let price = $page(e).find('.price').text().trim();
         for (let j = 0; j < items.length; j++) {
            if (imgUrl.includes(items[j].orderButtonDataQuid)) {
               items[j].price = price.slice(1);
               items[j].editButtonQuid = $page(e).find('.qty-container__edit').prop('data-quid');
               return;
            }
         }
         console.log('item in cart with name ' + itemName + ' not found')
      })
   // console.log(items);
   saveJSON(category + '_items.json', items)
   return items;
}

/**
 * given a page already on the cart with all items added,
 * clicks on the "edit" button for each one and finds the 
 * binary (none/normal) topping options.
 */
async function scrapeItemOptions(page, category) {
   await delay(1000);
   console.log('scraping binary toppings');
   let items = processCartItems(category);

   // go through each item and click the edit button
   for (let i = 0; i < items.length; i++) {
      console.log('getting toppings for item ' + items[i].itemName);
      let quid = items[i].editButtonQuid;
      let editSelector = `a[data-quid="${quid}"]`
      await page.waitForSelector(editSelector);
      await page.click(editSelector);
      try {
         await page.waitForSelector('div.card__body.serving-options__body', {timeout: 3000})
         saveToCache(category + '_cart_' + items[i].itemName + '.html', await page.content());
      } catch (e) {
         console.log('no options for item ' + items[i].itemName);
      }
      let addToOrder = '#product-add-btn';
      await page.waitForSelector(addToOrder);
      await page.click(addToOrder);
      await page.waitForSelector(addToOrder, {hidden: true});
      await delay(1000);
   }
}

/**
 * look through all the "edit" pages for a category,
 * pick out all the options for the toppings, and save the results.
 */
function processOptions(category) {
   let items = processCartItems(category);
   for (let i = 0; i < items.length; i++) {
      text = readFromCache(category + '_cart_' + items[i].itemName + '.html');
      const $page = cheerio.load(text);

      let customizations = {};

      // We don't need to check the prices for the binary toppings,
      // since the options are actually just removing them, they don't affect the prices
      $page('.toppings__wrapper').each((ii, ee) => {
         let section = $page(ee).prev().text().trim().toLowerCase();
         if (section == 'toppings') {
            let toppings = [];
            $page(ee).find('.topping__component').find('.topping__heading')
               .each((i2, e) => {
                  // check if default is none or not
                  // let def = true;
                  // $page(e).next().find('input.is-visually-hidden.segmented-radio__input').each((i2, e2) => {
                  //    if ($page(e2).next().text().trim().toLowerCase() == 'none') { // None
                  //          console.log('none')
                  //       if ($page(e2).is(':checked')) { // is selected by default
                  //          def = false;
                  //          console.log('setting default to false')
                  //       }
                  //    }
                  // })
                  toppings.push({
                     'optionName': $page(e).text().trim(),
                     'price': 0,
                     'default': (items[i].itemName.indexOf('Build Your Own') == -1), // hack for pasta default
                  });
               })
            if (toppings.length > 0) {
               customizations['toppings'] = {
                  options: toppings,
                  mutually_exclusive: false
               }
            }
         } else if (section == 'sauces') {
            // sauces for pasta
            let sauces = [];
            $page(ee).find('.topping__component').find('.topping__heading')
               .each((i, e) => {
                  sauces.push({
                     'optionName': $page(e).text().trim(),
                     'price': 0,
                     'default': i == 0,
                  });
               })
            if (sauces.length > 0) {
               customizations['sauces'] = {
                  options: sauces,
                  mutually_exclusive: true
               }
            }
         }
      })
      // process the serving options that are unique for wings (also pasta)
      // for drinks, add in a hack that swaps the order of the options
      // since the default is the one on the right for some reason
      let servingOptions = [];
      $page('.card__body.serving-options__body').find('label.segmented-radio__label')
         .each((i, e) => {
            servingOptions.push({
               'optionName': $page(e).text().trim(),
               'price': 0, // update this later on
               'default': i == 0,
               'quid': $page(e).prop('for'),
            })
         })
      if (servingOptions.length > 0) {
         if (category == 'entree-title-drinks' ) {
            servingOptions = servingOptions.reverse();
            for (let i = 0; i < servingOptions.length; i++) {
               servingOptions[i].default = !servingOptions[i].default;
            }
         }
         customizations['servingOptions'] = {
            options: servingOptions,
            mutually_exclusive: true,
         }
      }

      items[i]['customizations'] = customizations;

      // remove the edit button quid and order button quid
      // delete items[i].editButtonQuid;
      // delete items[i].orderButtonDataQuid;
   }

   saveJSON(category + '_items.json', items)
   // console.log(items)
   return items;
}

/**
 * Test out the different options for serving options, record the price after the change
 */
async function scrapeServingOptionPrices(page, category) {
   console.log('scraping serving option prices')
   let items = processOptions(category);

   for (let i = 0; i < items.length; i++) {
      console.log(items[i].itemName);

      if (!items[i].hasOwnProperty('customizations')) {
         console.log('no customizations');
         continue;
      }
      if (!items[i].customizations.hasOwnProperty('servingOptions')) {
         console.log('no serving options');
         continue;
      }
      let options = items[i].customizations.servingOptions.options;
      let prevOptionQuid;

      for (let j = 1; j < options.length; j++) {
         // navigate to edit screen
         let editQuid;
         if (prevOptionQuid == undefined) {
            editQuid = items[i].editButtonQuid;
         } else {
            editQuid = await getCartItemEditButtonQuid(category, items[i], prevOptionQuid)
         }
         console.log('editing item: ' + editQuid);
         let editSelector = `a[data-quid="${editQuid}"]`
         await page.waitForSelector(editSelector, {timeout: 2000});
         await page.click(editSelector);

         // click on the option
         let optionSelector = `label[for="${options[j].quid}"]`
         prevOptionQuid = options[j].quid;
         await page.waitForSelector(optionSelector);
         await page.click(optionSelector);

         // return to cart
         let addToOrder = '#product-add-btn';
         await page.waitForSelector(addToOrder);
         await page.click(addToOrder);
         await page.waitForSelector(addToOrder, {hidden: true});
         await delay(5000);
         saveToCache(category + '_cart_' + items[i].itemName + '_' + options[j].quid + '.html', await page.content());
      }
   }
}

/**
 * finds the quid for the edit button of an item in the cart given the category,
 * item name, and option quid for an item with different serving options (wings)
 */
async function getCartItemEditButtonQuid(category, item, optionQuid) {
   text = readFromCache(category + '_cart_' + item.itemName + '_' + optionQuid + '.html');
   const $page = cheerio.load(text);

   return new Promise(resolve => {
      $page('tr.order-summary__item')
         .each((i, e) => {
            let imgUrl = $page(e)
               .find('img').prop('src');
            if (imgUrl.includes(item.orderButtonDataQuid)) {
               let editButtonQuid = $page(e).find('.qty-container__edit').prop('data-quid');
               resolve(editButtonQuid);
            }
         })
   })
}

/**
 * processes the price changes caused from editing the serving options (wings)
 */
async function processServingOptionPrices(category) {
   let items = processOptions(category);

   // go through each item, any item with servingOptions, load the cache page for that
   for (let i = 0; i < items.length; i++) {
      console.log(items[i].itemName);

      if (!items[i].hasOwnProperty('customizations')) {
         console.log('no customizations');
         continue;
      }
      if (!items[i].customizations.hasOwnProperty('servingOptions')) {
         console.log('no serving options');
         continue;
      }
      let options = items[i].customizations.servingOptions.options;

      let defaultPrice = Number(items[i].price);

      for (let j = 1; j < options.length; j++) {
         let quid = options[j].quid;
         text = readFromCache(category + '_cart_' + items[i].itemName + '_' + quid + '.html');
         const $page = cheerio.load(text);

         let newPrice = await new Promise(resolve => {
            $page('tr.order-summary__item')
               .each((i2, e) => {
                  let imgUrl = $page(e)
                     .find('img').prop('src');
                  if (imgUrl.includes(items[i].orderButtonDataQuid)) {
                     let price = $page(e).find('.price').text().trim();
                     let priceNum = Number(price.slice(1));
                     resolve(priceNum)
                  }
               })
         })
         items[i].customizations.servingOptions.options[j].price = (newPrice - defaultPrice).toFixed(2)
      }
   }
   saveJSON(category + '_items.json', items)

   return items;
}


/**
 * Fetches the contents of a webpage from the url using puppeteer.
 * Caches the results in the cache/ directory so that we don't fetch redundantly.
 * Cache filenames are the same as the url but with slashes replaced with underscores.
 */
async function scrapeData() {

   // edit these variables to determine what to scrape
   // categories:
   // [
   // 0: 'entree-title-epic',
   // 1: 'entree-title-specialtypizza',
   // 2: 'entree-title-breadandovenbakeddips',
   // 3: 'entree-title-loaded-tots',
   // 4: 'entree-title-chicken',
   // 5: 'entree-title-desserts',
   // 6: 'entree-title-pasta',
   // 7: 'entree-title-sandwiches',
   // 8: 'entree-title-salads',
   // 9: 'entree-title-drinks',
   // 10: 'entree-title-extras',
   // 11: undefined,
   // 12: 'popular-items-panel-title'
   // }
   const DEBUG = true;
   const categoryIndex = 10;
   let skipScrape = false;
   // skipScrape = true;

   if (!skipScrape) { // perform scraping
      console.log('scraping...')
      const browser = await puppeteer.launch({
         headless: !DEBUG,
      })
      let page = await setupDeliveryOrder(browser);
      await scrapeMenuCategories(page);
      let categoryIds = processMenuCategories();
      await scrapeAddToCart(page, categoryIds[categoryIndex]);

      await scrapeItemOptions(page, categoryIds[categoryIndex]);

      await scrapeServingOptionPrices(page, categoryIds[categoryIndex]);

   }

   // run processing

   let categoryIds = processMenuCategories();
   // processCategoryHTML(categoryIds[categoryIndex]);
   // processCartItems(categoryIds[categoryIndex]);
   // processOptions(categoryIds[categoryIndex]);
   await processServingOptionPrices(categoryIds[categoryIndex])
}

if (require.main === module) {
   scrapeData();
}
