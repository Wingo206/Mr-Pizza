const { runQuery, employeePool,adminPool } = require('../util/database_util');
const { handleWorksAt, handleAuth, authRoles } = require("../authApi.js");

// custom_name can be item, topping, size
// The rest is self explanatory 
async function editAvailability(employeeRequest) {
    const { object, storeId, mid, option_name, available } = employeeRequest;
    try{
        if(object == "topping"){
            runQuery(employeePool, "UPDATE mrpizza.custom_availability SET available = " + toString(available) + "WHERE store_id = " + toString(storeId) + " AND mid = " + toString(mid) + " AND option_name = " + toString(option_name) + + " AND option_name = 'size'");
        }
        else if(object == "topping"){
            runQuery(employeePool, "UPDATE mrpizza.custom_availability SET available = " + toString(available) + "WHERE store_id = " + toString(storeId) + " AND mid = " + toString(mid) + " AND option_name = " + toString(option_name) + " AND option_name = 'topping'");
        }
        else if(object == "item"){
            runQuery(employeePool, "UPDATE mrpizza.item_availability SET available = " + toString(available) + "WHERE store_id = " + toString(storeId) + " AND mid = " + toString(mid))
        }
        
    }
    catch (error) {
        throw error;
    }
}

// Object can be topping or item
// Action can be delete, rename, price
// newName will be null if action is not rename
// newPrice will be null if action is not price
async function editMenu(adminRequest) {
    const { object, action, mid, newName, newPrice } = adminRequest;
    // Run a database query to update the menu item with the given itemId
}

async function addItem(adminRequest) {
    const {description, mid, price, image, available} = adminRequest;
    let storeId = 1 //I NEED TO FIND OUT HOW TO PROMPT ALL STORES. WILL PROBABLY NEED TO SELECT * FROM store or something :(
    await runQuery(adminPool, "INSERT INTO menu_item (mid, price, image_url, description) VALUES ( " + toString(mid) + ", " +  toString(price) +  ", " + toString(image) +  ", " + toString(description));
    await runQuery(adminPool, "INSERT INTO item_availability (mid, store_id, available) VALUES ( " + toString(mid) + ", " + toString(storeId) + ", " + toString(available));
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
async function handleAddItem(req, res) {
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
    addItem(adminRequest)
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
        handler: handleAuth(authRoles.admin, handleAddItem)
        },
       {
        method: 'POST',
        path: '/menu/availability',
        handler: handleWorksAt(handleAvailabilityEdit)
        }
    ]
    
}
