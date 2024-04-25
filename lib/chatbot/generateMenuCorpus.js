const path = require('path');
const fs = require('node:fs');
const {runQuery, adminPool} = require('../util/database_util');

/**
 * Loads information about all the items in the menu and generates
 * training data for the chatbot
 */
async function generateMenuCorpus() {
   let corpus = {
      "name": "Menu Information",
      "locale": "en-US",
   }

   let data = [];

   // add information about categories
   let categories = await runQuery(adminPool, `SELECT DISTINCT category FROM menu_item`);
   categories = categories.map(c => c.category);
   data.push({
      "intent": "Menu Categories",
      "utterances": [
         "categories",
         "category",
         "What are the categories?",
         "What categories are there?",
         "Tell me about the categories of items",
      ],
      "answers": [
         "These are the categories on our menu: \n - " + categories.join('\n - ')
      ]
   })

   // add information about the items in each category
   for (let i = 0; i < categories.length; i++) {
      let category = categories[i];
      let items = await runQuery(adminPool,
         'SELECT item_name FROM menu_item WHERE category = ?', category);
      items = items.map(i => i.item_name);
      data.push({
         "intent": `Category Items ${category}`,
         "utterances": [
            category,
            `What ${category} items do you offer?`,
            `What ${category} items do you have?`,
            `Tell me about ${category}`
         ],
         "answers": [
            `These are the ${category} we offer: \n - ${items.join('\n - ')}`
         ]
      })
   }

   filepath = path.join(__dirname, 'menuCorpus.json');
   corpus["data"] = data;
   fs.writeFileSync(filepath, JSON.stringify(corpus));
}

if (require.main === module) {
   generateMenuCorpus();
}

module.exports = {
   generateMenuCorpus
}
