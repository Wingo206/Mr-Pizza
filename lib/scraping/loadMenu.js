const {runQuery, adminPool} = require('../util/database_util');
const fs = require('node:fs');
const path = require('path');

let dataDir = path.join(__dirname, 'data');
let files = fs.readdirSync(dataDir).map(f => path.join(dataDir, f));

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
      for (let j = items.length-1; j >= 0; j--) {
         if (!items[j].hasOwnProperty('price') || Number(items[j].price) == NaN) {
            items.splic(j, 1);
         }
      }

      // add the item 
      let mappedItems = items.map(item => [
         item.itemName,
         Number(item.price),
         item.image,
         item.description,
         item.category + ((item.sectionName == 'default') ? '' : ' ' + item.sectionName)
      ]);
      let res = await runQuery(adminPool,
         `INSERT INTO menu_item(item_name, price, image_url, description, category) VALUES ?`,
         [mappedItems]
      )
      console.log(res)
   }
}

if (require.main === module) {
   loadMenu();
}
