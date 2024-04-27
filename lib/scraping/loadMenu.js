const {runQuery, adminPool} = require('../util/database_util');
const fs = require('node:fs');
const path = require('path');

let dataDir = path.join(__dirname, 'data');
let files = fs.readdirSync(dataDir).map(f => path.join(dataDir, f));

/**
 * Maps category to formatted category. If the entry is not there,
 * then use the item's section instead.
 */
const categoryMap = {
   'entree-title-chicken': 'Chicken',
   'entree-title-desserts': 'Desserts',
   'entree-title-drinks': 'Drinks',
   'entree-title-loaded-tots': 'Loaded Tots',
   'entree-title-pasta': 'Pasta',
   'entree-title-salads': 'Salads',
   'entree-title-sandwiches': 'Sandwiches',
   'entree-title-specialtypizza': 'Specialty Pizzas',
}
/**
 * Converts the category and section from the item into
 * a formatted string with the proper category
 */
function getFormattedCategory(item) {
   let out = categoryMap[item.category];
   if (out == undefined) {
      return item.sectionName;
   }
   return out;
}

/**
 * Loads all menu items and customizations from the scraped data
 */
async function loadMenu() {
   // clear out the old menu items if they exist
   await runQuery(adminPool, `DELETE FROM menu_item`);
   await runQuery(adminPool, `alter table menu_item AUTO_INCREMENT = 1`)

   // load menu items
   for (let i = 0; i < files.length; i++) {
      console.log('Reading file: ' + files[i]);
      let text = fs.readFileSync(files[i], 'utf8');
      let items = JSON.parse(text);

      // remove outliers first
      for (let j = items.length - 1; j >= 0; j--) {
         if (!items[j].hasOwnProperty('price') || isNaN(Number(items[j].price))) {
            items.splice(j, 1);
            console.log('hello' + j)
         }
      }
      console.log(items.map(it => it.itemName))

      // add the item 
      let mappedItems = items.map(item => [
         item.itemName,
         Number(item.price),
         item.image,
         item.description,
         getFormattedCategory(item)
      ]);
      let res = await runQuery(adminPool,
         `INSERT INTO menu_item(item_name, price, image_url, description, category) VALUES ?`,
         [mappedItems]
      )
      console.log(res.info)

      // add all the customizations for each item
      for (let j = 0; j < items.length; j++) {
         let curItem = items[j];
         if (!curItem.hasOwnProperty('customizations') || !Object.keys(curItem.customizations).length) {
            continue;
         }

         // figure out the mid of the item
         let midRes = await runQuery(adminPool, `SELECT mid FROM menu_item m WHERE m.item_name = ?`, curItem.itemName);
         let mid = midRes[0].mid;

         // add each customization type
         let customs = Object.keys(curItem.customizations);
         let mappedCustoms = customs.map(c => [
            c,
            mid,
            curItem.customizations[c].mutually_exclusive
         ])
         let customRes = await runQuery(adminPool,
            `INSERT INTO custom(custom_name, mid, mutually_exclusive) VALUES ?`,
            [mappedCustoms])
         console.log(customRes.info)

         // for each customization, add the options
         for (let k = 0; k < customs.length; k++) {
            let options = curItem.customizations[customs[k]].options;

            // custom map options which are not mutually exclusive, default and 0 price
            options = options.map(o => {
               if (!curItem.customizations[customs[k]].mutually_exclusive && o.default && Number(o.price) == 0) {
                  let optionCopy = JSON.parse(JSON.stringify(o));
                  optionCopy.optionName = 'No ' + optionCopy.optionName;
                  optionCopy.default = false;
                  return optionCopy;
               }
               return o;
            })

            let mappedOptions = options.map(o => [
               customs[k],
               mid,
               o.optionName,
               o.price,
               o.default
            ]);
            let optionsRes = await runQuery(adminPool,
               `INSERT INTO custom_option(custom_name, mid, option_name, price, isDefault) VALUES ?`,
               [mappedOptions])
            console.log(optionsRes.info)
         }
      }
   }

}

/**
 * Sets availability of all menu items and customizations for a given store
 */
async function makeAllAvailable(storeId) {
   // make all menu items available
   let mids = await runQuery(adminPool, `SELECT mid FROM menu_item`);
   mids = mids.map(m => m.mid);
   let mappedMids = mids.map(m => [
      m,
      storeId,
      true
   ])
   let res = await runQuery(adminPool,
      `INSERT INTO item_availability(mid, store_id, available) VALUES ?`,
      [mappedMids])
   console.log(res.info);

   // make all customs available
   let customOptions = await runQuery(adminPool, `SELECT custom_name, mid, option_name FROM custom_option`)
   let mappedOptions = customOptions.map(co => [
      co.custom_name,
      co.mid,
      co.option_name,
      storeId,
      true
   ])
   let res2 = await runQuery(adminPool,
      `INSERT INTO custom_availability(custom_name, mid, option_name, store_id, available) VALUES ?`,
      [mappedOptions])
   console.log(res2.info);
}

if (require.main === module) {
   loadMenu();
}

module.exports = {
   loadMenu,
   makeAllAvailable
}
