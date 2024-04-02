const { runQuery, employeePool } = require("../util/database_util");
const { handleWorksAt, handleAuth, authRoles } = require("../authApi.js");
const { queryStoreLatlng } = require("./assignmentApi")

let orders = [];

/**
 * api endpoint
 * url: /directions/assignedOrder
 * input: none
 * returns: json array of orders assigned to the employee
 */
async function getAssignedOrders(req, res, jwtBody) {
    // check if the user is a driver
    let roleRes = await runQuery(employeePool,
        `select * from employee_account where type = "driver"`);
    if (roleRes.length == 0) {
        res.writeHead(400, { 'Content-type': 'text/plain' })
        res.end('User is not a driver');
        return;
    }

    let queryRes = await runQuery(employeePool,
        `SELECT o.*
        FROM customer_order o
        JOIN in_batch ib on ib.order_id = o.order_id
        JOIN delivery_batch db on db.batch_id = ib.batch_id
        WHERE db.assignedToEmp = ${jwtBody.id}
        ORDER BY ib.order_index ASC
        `);

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(queryRes));
}


/**
 * api endpoint
 * url: storeid
 * input: JSON body array of order ids
 * returns: json array of waypoint locations
 */
async function getRouteWaypoints(req, res, jwtBody, storeId) {
    // get the body
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
    let decodedData = JSON.parse(body);
    if (!decodedData.hasOwnProperty('orders')) {
        res.writeHead(400, { 'Content-type': 'text/plain' })
        res.end('Required property missing: orders');
        return;
    }
    console.log(decodedData)
    let orders = decodedData.orders;
    if (!Array.isArray(orders)) {
        res.writeHead(400, { 'Content-type': 'text/plain' })
        res.end('Orders is not an array');
        return;
    }

    // get all the waypoint locations
    let locations = [];

    // add mr pizza location first
    let mrpizzaLatLng = await queryStoreLatlng(storeId);
    locations.push(mrpizzaLatLng);
    for (let i = 0; i < orders.length; i++) {
        let order_id = orders[i];
        let queryRes = await runQuery(employeePool, `select delivery_latlng from customer_order where order_id = ${order_id}`);
        if (queryRes.length == 0) {
            res.writeHead(400, { 'Content-type': 'text/plain' })
            res.end('Invalid order id.');
            return;
        }
        locations.push(queryRes[0].delivery_latlng);
    }
    locations.push(mrpizzaLatLng);

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(locations));
}

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/directions/assignedOrder',
            handler: handleAuth(authRoles.employee, getAssignedOrders)
        },
        {
            method: 'POST',
            path: /^\/directions\/waypoints\/[\d]$/,
            handler: handleWorksAt(getRouteWaypoints)
        }
    ]
}