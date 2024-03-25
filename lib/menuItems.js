const { runQuery } = require('./util/database_util');

// Function to fetch menu items from the database based on storeId
async function getMenuItemsFromDatabase(storeId) {
    try {
        // Execute SQL query to retrieve menu items for the specified store ID
        const queryItems = await runQuery('SELECT * FROM menu_Item JOIN item_availability USING (mid) WHERE store_id = 1 AND available = 1;', [storeId]);
        const queryToppings = await runQuery('SELECT * FROM topping JOIN topping_availability USING (topping_name, mid) WHERE store_id = 1 AND available = 1;', [storeId]);

        // Convert query result to JSON format for TOPPINGS
        const toppingsJSON = queryToppings.map(topping => ({
            topping_name: topping.topping_name,
            mid: topping.mid,
            price: topping.price,
            // We can add more here as needed
        }));

        // Convert query result to JSON format
        const menuItemsJson = queryItems.map(item => ({
            description: item.description,
            mid: item.mid,
            price: item.price,
            image: item.image,
            // Add toppings to each menu item
            toppings: toppingsJSON.filter(topping => topping.mid === item.mid)
        }));

        return menuItemsJson;
    } catch (error) {
        // Handle any errors that occur while retrieving menu items from the database
        throw error;
    }
}
async function handleMenuItem(req, res) {
    res.writeHead(200, {'Content-type': 'text/plain'});
    res.write(getMenuItemsFromDatabase)
    res.end();
 }
module.exports = {
    routes: [
       {
          method: 'GET',
          path: '/menu/',
          handler: handleMenuItem
       }
    ]
 }
