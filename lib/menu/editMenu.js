const { runQuery, employeePool,adminPool } = require('../util/database_util');
const { handleWorksAt, handleAuth, authRoles } = require("../authApi.js");

// Object can be item, toppings, size, servingOptions, sauces, crusts, meats, nonMeats, cheese
async function editAvailability(employeeRequest) {
    const { object, storeId, mid, option_name, available } = employeeRequest;
    try{
        if(object == "item"){
            runQuery(employeePool, "UPDATE mrpizza.item_availability SET available = " + toString(available) + "WHERE store_id = " + toString(storeId) + " AND mid = " + toString(mid))
        }else{
            runQuery(employeePool, "UPDATE mrpizza.custom_availability SET available = " + toString(available) + "WHERE store_id = " + toString(storeId) + " AND mid = " + toString(mid) + " AND option_name = " + toString(option_name) + " AND custom_name = " + toString(object));
        } 
    }
    catch (error) {
        throw error;
    }
}

// Should work is delete cascade
// Object can be item, toppings, size, servingOptions, sauces, crusts, meats, nonMeats, cheese
// Action can be delete or edit
// Property for item: item_name, price, image, description, category
// Property for customs: option_name, price, isDefault
async function editMenu(adminRequest) {
    const { object, property, action, mid, name, newValue} = adminRequest;
    try{
        if(action == 'delete'){
            if(object == 'item'){
                runQuery(adminPool, "DELETE FROM mrpizza.menu_item WHERE mid = " + toString(mid) + " AND item_name = " + toString(name));
                runQuery(adminPool, "DELETE FROM mrpizza.menu_availability WHERE mid = " + toString(mid));
            } else{
                runQuery(adminPool, "DELETE FROM mrpizza.custom WHERE mid = " + toString(mid)+ " AND option_name = " + toString(name) + " AND custom_name = " + toString(object));
                runQuery(adminPool, "DELETE FROM mrpizza.menu_availability WHERE mid = " + toString(mid) + " AND option_name = " + toString(name) + " AND custom_name = " + toString(object));
            } 
        } else { // Edit object
            if(object == 'item'){
                runQuery(adminPool, "UPDATE mrpizza.menu_item SET " + toString(property) + " = " + toString(newValue) + " WHERE mid = " + toString(mid) + " AND item_name = " + toString(name));
            } else{
                if (property == 'option_name'){
                    runQuery(adminPool, "UPDATE mrpizza.custom_option SET " + toString(property) + " = " + toString(newValue) + " WHERE mid = " + toString(mid) + " AND option_name = " + toString(name) + " AND custom_name = " + toString(object));
                    runQuery(adminPool, "UPDATE mrpizza.custom_availability SET " + toString(property) + " = " + toString(newValue) + " WHERE mid = " + toString(mid) + " AND option_name = " + toString(name) + " AND custom_name = " + toString(object));
                }else{
                    runQuery(adminPool, "UPDATE mrpizza.custom_option SET " + toString(property) + " = " + toString(newValue) + " WHERE mid = " + toString(mid) + " AND option_name = " + toString(name) + " AND custom_name = " + toString(object));
                }
            }
        }
    }
    catch(error) {
        throw error;
    }
}

async function addItem(adminRequest) {
    const {object, description, mid, price, image, item_name, category, available} = adminRequest;
    let storeId = 1 
    try{
        await runQuery(adminPool, "INSERT INTO mrpizza.menu_item (mid, price, image_url, description, item_name, category) VALUES ( " + toString(mid) + ", " +  toString(price) +  ", " + toString(image) +  ", " + toString(description) + ", " + toString(item_name) + ", " + toString(category) + ")");
        await runQuery(adminPool, "INSERT INTO mrpizza.item_availability (mid, store_id, available) VALUES ( " + toString(mid) + ", " + toString(storeId) + ", " + toString(available) + ")");
    }
    catch(error) {
        throw error;
    }
}

async function addCustom(adminRequest) {
    const {object, custom_name, mid, option_name, price, isDefault, available, mutually_exclusive} = adminRequest;
    let storeId = 1
    try{
        await runQuery(adminPool, "INSERT INTO mrpizza.custom_option (custom_name, mid, option_name, price, isDefault) VALUES ( " + toString(custom_name) + ", " +  toString(mid) +  ", " + toString(option_name) +  ", " + toString(price) + ", " + toString(isDefault) + ")");
        await runQuery(adminPool, "INSERT INTO mrpizza.custom_availability (mid, custom_name, option_name, store_id, available) VALUES ( " + toString(mid) + ", " + toString(custom_name) + ", " + toString(option_name) +  ", " + toString(storeId) + ", " + toString(available) + ")");
        await runQuery(adminPool, "INSERT INTO mrpizza.custom (custom_name, mid, mutually_exclusive) VALUES ( " + toString(custom_name) + ", " + toString(mid) + ", " + toString(mutually_exclusive) + ")");
    }
    catch(error) {
        throw error;
    }
}

async function handleItemEdit(req, res) {
    const contentType = req.headers['content-type']
    if (contentType != 'application/json') {
        res.writeHead(415, { 'Content-type': 'text/plain' })
        res.end('json body required.');
        return;
    }
    let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        })
        req.on('end', () => {
            resolve(data);
        })
    });
    let adminRequest = JSON.parse(body);
    editMenu(adminRequest)
}

async function handleAddtoMenu(req, res) {
    const contentType = req.headers['content-type']
    if (contentType != 'application/json') {
        res.writeHead(415, { 'Content-type': 'text/plain' })
        res.end('json body required.');
        return;
    }
    let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        })
        req.on('end', () => {
            resolve(data);
        })
    });
    let adminRequest = JSON.parse(body);
    let {object, description, mid, price, image, item_name, category, available} = adminRequest;
    if (object == 'item'){
        addItem(adminRequest);
    } else{ 
        addCustom(adminRequest);
    }
}

async function handleAvailabilityEdit(req, res) {
    const contentType = req.headers['content-type']
    if (contentType != 'application/json') {
        res.writeHead(415, { 'Content-type': 'text/plain' })
        res.end('json body required.');
        return;
    }
    let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        })
        req.on('end', () => {
            resolve(data);
        })
    });
    let employeeRequest = JSON.parse(body);
    editAvailability(employeeRequest);
    
}

module.exports = {
    routes: [
       {
          method: 'POST',
          path: '/menu/edit',
          handler: handleAuth(authRoles.admin, handleItemEdit)
        },
       {
        method: 'POST',
        path: '/menu/add',
        handler: handleAuth(authRoles.admin, handleAddtoMenu)
        },
       {
        method: 'POST',
        path: '/menu/availability',
        handler: handleWorksAt(handleAvailabilityEdit)
        }
    ]
    
}
