const { runQuery } = require('./util/database_util');

// Function to fetch menu items from the database based on storeId
async function getMenuItemsFromDatabase(storeId) {
    try {
        // Execute SQL query to retrieve menu items for the specified store ID
        const queryResult = await runQuery('SELECT * FROM menu_items WHERE store_id = ?', [storeId]);

        // Convert query result to JSON format
        const menuItemsJson = queryResult.map(item => ({
            description: item.description,
            MID: item.MID,
            price: item.price,
            image: item.image
            // We can add more here as needed
        }));

        return menuItemsJson;
    } catch (error) {
        // Handle any errors that occur while retrieving menu items from the database
        throw error;
    }
}

// Function to filter available items and their toppings
function filterAvailableItems(menuItems) {
    // Filter out unavailable items and get only available toppings for each available item
    const availableItems = [];
    for (const item of menuItems) {
        if (item.available) {
            const availableToppingsJson = filterAvailableToppings(item.toppings);
            availableItems.push({
                description: item.description,
                MID: item.MID,
                price: item.price,
                image: item.image,
                toppings: availableToppingsJson
            });
        }
    }
    return availableItems;
}

// Function to filter available toppings
function filterAvailableToppings(toppings) {
    // Filter out unavailable toppings
    const availableToppings = [];
    for (const topping of toppings) {
        if (topping.available) {
            availableToppings.push({
                name: topping.name,
                price: topping.price
            });
        }
    }
    return availableToppings;
}

module.exports = {
    getMenuItemsFromDatabase,
    filterAvailableItems
};
