const { runQuery, employeePool, adminPool } = require('../util/database_util');
const { handleWorksAt, handleAuth, authRoles } = require("../authApi.js");

// Object can be item, toppings, size, servingOptions, sauces, crusts, meats, nonMeats, cheese
async function editAvailability(employeeRequest) {
    const { object, custom_name, storeId, mid, option_name, available } = employeeRequest;
    const real_available = boolean_switch(available);
    try {
        if (object == "item") {
            await runQuery(employeePool, `UPDATE mrpizza.item_availability SET available = '${real_available}' WHERE store_id = '${storeId}' AND mid = '${mid}'`);
        } else {
            await runQuery(employeePool, `UPDATE mrpizza.custom_availability SET available = '${real_available}' WHERE store_id = '${storeId}' AND mid = '${mid}' AND option_name = '${option_name}' AND custom_name = '${custom_name}'`);
        }
    } catch (error) {
        throw error;
    }
}

// Should work is delete cascade
// Object can be item, toppings, size, servingOptions, sauces, crusts, meats, nonMeats, cheese
// Action can be delete or edit
// Property for item: item_name, price, image, description, category
// Property for customs: price and isDefault
async function editMenu(adminRequest) {
    const { object, custom_name, property, action, mid, name, newValue } = adminRequest;
    try {
        if (action == 'delete') {
            if (object == 'item') {
                await runQuery(adminPool, `DELETE FROM mrpizza.menu_item WHERE mid = '${mid}' AND item_name = '${name}'`);
            } else {
                await runQuery(adminPool, `DELETE FROM mrpizza.custom_option WHERE mid = '${mid}' AND option_name = '${name}' AND custom_name = '${custom_name}'`);
            }
        } else { // Edit object
            if (object == 'item') {
                await runQuery(adminPool, `UPDATE mrpizza.menu_item SET ${property} = '${newValue}' WHERE mid = '${mid}' AND item_name = '${name}'`);
            } else {
                await runQuery(adminPool, `UPDATE mrpizza.custom_option SET ${property} = '${newValue}' WHERE mid = '${mid}' AND option_name = '${name}' AND custom_name = '${custom_name}'`);
            }
        }
    } catch (error) {
        throw error;
    }
}

function boolean_switch(available) {
    return available ? 1 : 0;
}

async function addItem(adminRequest) {
    const { object, description, mid, price, image, item_name, category, available } = adminRequest;
    const storeId = 1;
    const real_available = boolean_switch(available);
    try {
        await runQuery(adminPool, `INSERT INTO mrpizza.menu_item (mid, price, image_url, description, item_name, category) VALUES ('${mid}', '${price}', '${image}', '${description}', '${item_name}', '${category}')`);
        await runQuery(adminPool, `INSERT INTO mrpizza.item_availability (mid, store_id, available) VALUES ('${mid}', '${storeId}', '${real_available}')`);
    } catch (error) {
        throw error;
    }
}

async function addCustom(adminRequest) {
    const { object, custom_name, mid, option_name, price, isDefault, available, mutually_exclusive } = adminRequest;
    const storeId = 1;
    let mutual = boolean_switch(mutually_exclusive);
    let Default = boolean_switch(isDefault);
    let real_available = boolean_switch(available);
    try {
        await runQuery(adminPool, `INSERT INTO mrpizza.custom_option (custom_name, mid, option_name, price, isDefault) VALUES ('${custom_name}', '${mid}', '${option_name}', '${price}', '${Default}')`);
        await runQuery(adminPool, `INSERT INTO mrpizza.custom_availability (mid, custom_name, option_name, store_id, available) VALUES ('${mid}', '${custom_name}', '${option_name}', '${storeId}', '${real_available}')`);
    } catch (error) {
        throw error;
    }
}

async function handleItemEdit(req, res) {
    const contentType = req.headers['content-type'];
    if (contentType !== 'application/json') {
        res.writeHead(415, { 'Content-type': 'text/plain' });
        res.end('json body required.');
        return;
    }
    let body = '';
    req.on('data', chunk => {
        body += chunk;
    });
    req.on('end', async () => {
        try {
            const adminRequest = JSON.parse(body);
            await editMenu(adminRequest);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Menu item edited successfully' }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

async function handleAddtoMenu(req, res) {
    const contentType = req.headers['content-type'];
    if (contentType !== 'application/json') {
        res.writeHead(415, { 'Content-type': 'text/plain' });
        res.end('json body required.');
        return;
    }
    let body = '';
    req.on('data', chunk => {
        body += chunk;
    });
    req.on('end', async () => {
        try {
            const adminRequest = JSON.parse(body);
            if (adminRequest.object === 'item') {
                await addItem(adminRequest);
            } else {
                await addCustom(adminRequest);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Item added to menu successfully' }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

async function handleAvailabilityEdit(req, res) {
    const contentType = req.headers['content-type'];
    if (contentType !== 'application/json') {
        res.writeHead(415, { 'Content-type': 'text/plain' });
        res.end('json body required.');
        return;
    }
    let body = '';
    req.on('data', chunk => {
        body += chunk;
    });
    req.on('end', async () => {
        try {
            const employeeRequest = JSON.parse(body);
            await editAvailability(employeeRequest);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Availability edited successfully' }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
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
            handler: handleAuth(authRoles.employee, handleAvailabilityEdit)
        }
    ]
};
