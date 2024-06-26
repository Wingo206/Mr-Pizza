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
            `Tell me about ${category}`,
            `I want ${category}`
         ],
         "answers": [
            `These are the ${category} we offer: \n - ${items.join('\n - ')}`
         ]
      })
      for (let j = 0; j < items.length; j++) {
         let itemName = items[j];
         customs = await runQuery(adminPool,
            `SELECT custom_name, option_name 
            FROM menu_item m
            JOIN custom_option co ON co.mid = m.mid
            WHERE m.item_name = ?`, itemName)
         // different answer if there's no customizations
         let answer;

         let entry =
         {
            "intent": `Customizations ${itemName}`,
            "utterances": [
               itemName,
               `Tell me about ${itemName}`,
               `What options are available for ${itemName}?`,
               `What customizations are there for ${itemName}?`,
            ],
            "answers": [ ]
         }
         if (customs.length == 0) {
            entry.answers.push(`There are no customization options for ${itemName}.`);
         } else {
            processedCustoms = {};
            for (let k = 0; k < customs.length; k++) {
               if (!processedCustoms.hasOwnProperty(customs[k].custom_name)) {
                  processedCustoms[customs[k].custom_name] = [];
               }
               processedCustoms[customs[k].custom_name].push(customs[k].option_name);
            }
            let formattedCustoms = Object.entries(processedCustoms)
               .map(([c, o]) => c + '\n - ' + o.join('\n - ')
               )
               .join('\n\n')
            entry.answers.push(`Here are the customization options for ${itemName}: \n\n${formattedCustoms}`)
            let customNames = Object.keys(processedCustoms);
            customNames.forEach(c => entry.utterances.push(`What ${c} are there for ${itemName}?`));
         }
         data.push(entry);
      }
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
