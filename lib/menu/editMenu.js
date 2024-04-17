const { runQuery, employeePool,adminPool } = require('../util/database_util');
const { handleWorksAt, handleAuth, authRoles } = require("../authApi.js");

// custom_name can be item, topping, size
// The rest is self explanatory 
async function editAvailability(employeeRequest) {
    const { object, storeId, mid, option_name, available } = employeeRequest;
    try{
        if(object == "size"){
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

// THERE IS A CHANCE THERE MAY BE AN ISSUE WITH DELETING FROM TABLE BECAUSE THE DATA IS USED ELSEWHERE SO I STILL NEED TO TEST THAT!!!!!!!!!!!!!!!!

// Object can be size, topping, or item
// Action can be delete, rename, price
// newName will be null if action is not rename
// newPrice will be null if action is not price
async function editMenu(adminRequest) {
    const { object, action, mid, name, newName, newPrice } = adminRequest;
    if(action == 'delete'){
        if(object == 'item'){
            runQuery(adminPool, "DELETE FROM mrpizza.menu_item WHERE mid = " + toString(mid) + "AND description = " + toString(name));
            runQuery(adminPool, "DELETE FROM mrpizza.menu_availability WHERE mid = " + toString(mid));
        } else if(object == 'size'){
            runQuery(adminPool, "DELETE FROM mrpizza.custom WHERE mid = " + toString(mid)+ "AND option_name = " + toString(name) + "AND custom_name = 'size'");
            runQuery(adminPool, "DELETE FROM mrpizza.menu_availability WHERE mid = " + toString(mid) + "AND option_name = " + toString(name) + "AND custom_name = 'size'");
        } else if(object == 'topping'){
            runQuery(adminPool, "DELETE FROM mrpizza.menu_item WHERE mid = " + toString(mid) + "AND option_name = " + toString(name) + "AND custom_name = 'topping'");
            runQuery(adminPool, "DELETE FROM mrpizza.menu_availability WHERE mid = " + toString(mid) + "AND option_name = " + toString(name) + "AND custom_name = 'topping'");
        }
    } else if(action == 'rename'){
        if(object == 'item'){
            runQuery(adminPool, "UPDATE mrpizza.menu_item SET description = " + toString(newName) + "WHERE mid = " + toString(mid) + "AND description = " + toString(name));
        } else if(object == 'size'){
            runQuery(adminPool, "UPDATE mrpizza.custom_option SET option_name = " + toString(newName) + "WHERE mid = " + toString(mid) + "AND option_name = " + toString(name) + "AND custom_name = 'size'");
            runQuery(adminPool, "UPDATE mrpizza.custom_availability SET option_name = " + toString(newName) + "WHERE mid = " + toString(mid) + "AND option_name = " + toString(name) + "AND custom_name = 'size'");

        } else if(object == 'topping'){
            runQuery(adminPool, "UPDATE mrpizza.custom_option SET option_name = " + toString(newName) + "WHERE mid = " + toString(mid) + "AND option_name = " + toString(name) + "AND custom_name = 'size'");
            runQuery(adminPool, "UPDATE mrpizza.custom_availability SET option_name = " + toString(newName) + "WHERE mid = " + toString(mid) + "AND option_name = " + toString(name)+ "AND custom_name = 'topping'");
        }
    } if(action == 'price'){
        if(object == 'item'){
            runQuery(adminPool, "UPDATE mrpizza.menu_item SET price = " + toString(newPrice) + "WHERE mid = " + toString(mid) + "AND description = " + toString(name));
        } else if(object == 'size'){
            runQuery(adminPool, "UPDATE mrpizza.custom_option SET price = " + toString(newPrice) + "WHERE mid = " + toString(mid) + "AND option_name = " + toString(name) + "AND custom_name = 'size'");
        } else if(object == 'topping'){
            runQuery(adminPool, "UPDATE mrpizza.custom_option SET price = " + toString(newPrice) + "WHERE mid = " + toString(mid) + "AND option_name = " + toString(name)+ "AND custom_name = 'topping'");
        }
    }
}

async function addItem(adminRequest) {
    const {description, mid, price, image, available} = adminRequest;
    let storeId = 1 //I NEED TO FIND OUT HOW TO PROMPT ALL STORES. WILL PROBABLY NEED TO SELECT * FROM store or something :(
    await runQuery(adminPool, "INSERT INTO mrpizza.menu_item (mid, price, image_url, description) VALUES ( " + toString(mid) + ", " +  toString(price) +  ", " + toString(image) +  ", " + toString(description));
    await runQuery(adminPool, "INSERT INTO mrpizza.item_availability (mid, store_id, available) VALUES ( " + toString(mid) + ", " + toString(storeId) + ", " + toString(available));
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
