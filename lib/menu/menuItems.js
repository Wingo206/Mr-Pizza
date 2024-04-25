const { runQuery, customerPool } = require('../util/database_util');

// Function to fetch menu items from the database based on storeId
async function getMenuItemsFromDatabase(storeId) {
    try {
        // Execute SQL query to retrieve menu items for the specified store ID
        const queryItems = await runQuery(customerPool,'SELECT * FROM mrpizza.menu_item JOIN mrpizza.item_availability USING (mid) WHERE store_id = 1;');
        const queryToppings = await runQuery(customerPool,"SELECT * FROM (mrpizza.custom_option JOIN mrpizza.custom_availability USING (custom_name, mid, option_name)) JOIN mrpizza.custom USING (custom_name, mid) WHERE store_id = 1 AND custom_name = 'toppings';");
        const querySize = await runQuery(customerPool,"SELECT * FROM (mrpizza.custom_option JOIN mrpizza.custom_availability USING (custom_name, mid, option_name)) JOIN mrpizza.custom USING (custom_name, mid) WHERE store_id = 1 AND custom_name = 'size';");
        const queryServingOptions = await runQuery(customerPool,"SELECT * FROM (mrpizza.custom_option JOIN mrpizza.custom_availability USING (custom_name, mid, option_name)) JOIN mrpizza.custom USING (custom_name, mid) WHERE store_id = 1 AND custom_name = 'servingOptions';");
        const querySauces = await runQuery(customerPool,"SELECT * FROM (mrpizza.custom_option JOIN mrpizza.custom_availability USING (custom_name, mid, option_name)) JOIN mrpizza.custom USING (custom_name, mid) WHERE store_id = 1 AND custom_name = 'sauces';");
        const queryCrust = await runQuery(customerPool,"SELECT * FROM (mrpizza.custom_option JOIN mrpizza.custom_availability USING (custom_name, mid, option_name)) JOIN mrpizza.custom USING (custom_name, mid) WHERE store_id = 1 AND custom_name = 'crust';");
        const queryMeats = await runQuery(customerPool,"SELECT * FROM (mrpizza.custom_option JOIN mrpizza.custom_availability USING (custom_name, mid, option_name)) JOIN mrpizza.custom USING (custom_name, mid) WHERE store_id = 1 AND custom_name = 'meats';");
        const queryNonMeats = await runQuery(customerPool,"SELECT * FROM (mrpizza.custom_option JOIN mrpizza.custom_availability USING (custom_name, mid, option_name)) JOIN mrpizza.custom USING (custom_name, mid) WHERE store_id = 1 AND custom_name = 'nonMeats';");
        const queryCheese = await runQuery(customerPool,"SELECT * FROM (mrpizza.custom_option JOIN mrpizza.custom_availability USING (custom_name, mid, option_name)) JOIN mrpizza.custom USING (custom_name, mid) WHERE store_id = 1 AND custom_name = 'cheese';");

        // Convert query result to JSON format
        const toppingsJSON = queryToppings.map(topping => ({
            topping_name: topping.option_name,
            mid: topping.mid,
            price: topping.price,
            available: topping.available,
            mutuallyExclusive: topping.mutually_exclusive,
            isDefault: topping.isDefault
        }));
        const sizeJSON = querySize.map(size => ({
            topping_name: size.option_name,
            mid: size.mid,
            price: size.price,
            available: size.available,
            mutuallyExclusive: size.mutually_exclusive,
            isDefault: size.isDefault
        }));
        const servingOptionsJSON = queryServingOptions.map(servingOptions => ({
            topping_name: servingOptions.option_name,
            mid: servingOptions.mid,
            price: servingOptions.price,
            available: servingOptions.available,
            mutuallyExclusive: servingOptions.mutually_exclusive,
            isDefault: servingOptions.isDefault
        }));
        const saucesJSON = querySauces.map(sauces => ({
            topping_name: sauces.option_name,
            mid: sauces.mid,
            price: sauces.price,
            available: sauces.available,
            mutuallyExclusive: sauces.mutually_exclusive,
            isDefault: sauces.isDefault
        }));
        const crustJSON = queryCrust.map(crust => ({
            topping_name: crust.option_name,
            mid: crust.mid,
            price: crust.price,
            available: crust.available,
            mutuallyExclusive: crust.mutually_exclusive,
            isDefault: crust.isDefault
        }));
        const meatsJSON = queryMeats.map(meats => ({
            topping_name: meats.option_name,
            mid: meats.mid,
            price: meats.price,
            available: meats.available,
            mutuallyExclusive: meats.mutually_exclusive,
            isDefault: meats.isDefault
        }));
        const nonMeatsJSON = queryNonMeats.map(nonMeats => ({
            topping_name: nonMeats.option_name,
            mid: nonMeats.mid,
            price: nonMeats.price,
            available: nonMeats.available,
            mutuallyExclusive: nonMeats.mutually_exclusive,
            isDefault: nonMeats.isDefault
        }));
        const cheeseJSON = queryCheese.map(cheese => ({
            topping_name: cheese.option_name,
            mid: cheese.mid,
            price: cheese.price,
            available: cheese.available,
            mutuallyExclusive: cheese.mutually_exclusive,
            isDefault: cheese.isDefault
        }));

        // Convert query result to JSON format
        const menuItemsJson = queryItems.map(item => ({
            mid: item.mid,
            item_name: item.item_name,
            price: item.price,
            image: item.image_url,
            description: item.description,
            category: item.category,
            available: item.available,
            // Add customizations to each menu item
            toppings: toppingsJSON.filter(topping => topping.mid === item.mid),
            size: sizeJSON.filter(size => size.mid === item.mid),
            servingOptions: servingOptionsJSON.filter(servingOptions => servingOptions.mid === item.mid),
            sauces: saucesJSON.filter(sauces => sauces.mid === item.mid),
            crust: crustJSON.filter(crust => crust.mid === item.mid),
            meats: meatsJSON.filter(meats => meats.mid === item.mid),
            nonMeats: nonMeatsJSON.filter(nonMeats => nonMeats.mid === item.mid),
            cheese: cheeseJSON.filter(cheese => cheese.mid === item.mid)
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
