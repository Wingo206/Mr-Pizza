const { runQuery, customerPool } = require('../util/database_util');

// Function to fetch menu items from the database based on storeId
async function getMenuItemsFromDatabase(storeId) {
    try {
        // Execute SQL query to retrieve menu items for the specified store ID
        const queryItems = await runQuery(customerPool,'SELECT * FROM mrpizza.menu_item JOIN mrpizza.item_availability USING (mid) WHERE store_id = 1;');
        const queryToppings = await runQuery(customerPool,"SELECT * FROM (mrpizza.custom_option JOIN mrpizza.custom_availability USING (custom_name, mid, option_name)) JOIN mrpizza.custom USING (custom_name, mid) WHERE store_id = 1 AND custom_name = 'topping';");
        const querySize = await runQuery(customerPool,"SELECT * FROM (mrpizza.custom_option JOIN mrpizza.custom_availability USING (custom_name, mid, option_name)) JOIN mrpizza.custom USING (custom_name, mid) WHERE store_id = 1 AND custom_name = 'size';");

        // Convert query result to JSON format for TOPPINGS
        const toppingsJSON = queryToppings.map(topping => ({
            topping_name: topping.option_name,
            mid: topping.mid,
            price: topping.price,
            available: topping.available,
            mutuallyExclusive: topping.mutually_exclusive
            // We can add more here as needed
        }));
        const sizeJSON = querySize.map(size => ({
            topping_name: size.option_name,
            mid: size.mid,
            price: size.price,
            available: size.available,
            mutuallyExclusive: size.mutually_exclusive
            // We can add more here as needed
        }));

        // Convert query result to JSON format
        const menuItemsJson = queryItems.map(item => ({
            description: item.description,
            mid: item.mid,
            price: item.price,
            image: item.image_url,
            available: item.available,
            // Add toppings to each menu item
            toppings: toppingsJSON.filter(topping => topping.mid === item.mid),
            size: sizeJSON.filter(size => size.mid === item.mid)
        }));

        return menuItemsJson;
    } catch (error) {
        // Handle any errors that occur while retrieving menu items from the database
        throw error;
    }
}

async function handleMenuItem(req, res) {
    try {
        const menuItems = await getMenuItemsFromDatabase(1); // Assuming store ID 1 for now
        console.log("Menu items:", menuItems);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(menuItems));
    } catch (error) {
        console.error("Error fetching menu items:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

const fs = require('fs');
const path = require('path');
const CART_FILE_PATH = path.join(__dirname, 'data', 'cart.json');

function readCartFile() {
    if (fs.existsSync(CART_FILE_PATH)) {
        return JSON.parse(fs.readFileSync(CART_FILE_PATH, 'utf-8'));
    } else {
        return [];
    }
}

function directoryExists(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)){
        return true;
    }
    directoryExists(dirname);
    fs.mkdirSync(dirname);
}

async function addItemToCart(req, res) {
    try {
        const item = req.body;
        directoryExists(CART_FILE_PATH);
        const cartItems = readCartFile();
        cartItems.push(item);
        // Write the updated cart items to the cart.json file
        fs.writeFileSync(CART_FILE_PATH, JSON.stringify(cartItems, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: "Item added to cart" }));
    } catch (error) {
        console.error("Error adding item to cart:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

module.exports = {
    routes: [
       {
          method: 'GET',
          path: '/menu',
          handler: handleMenuItem
       }
    ]
}

module.exports.routes.push({
    method: 'POST',
    path: '/cart',
    handler: addItemToCart
});
