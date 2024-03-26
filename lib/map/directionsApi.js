const { runQuery, employeePool } = require("../util/database_util");
const { handleWorksAt, handleAuth, authRoles } = require("../authApi.js");
const { queryStoreLatlng } = require("./assignmentApi")

async function getOrders(req, res) {
    let nums = req.url.match(/\d+/g);

    let orders = await runQuery(employeePool,
        `SELECT delivery_latlng
        FROM in_batch i
        JOIN customer_order o ON in_batch.order_id = customer_order.order_id
        JOIN delivery_batch d ON in_batch.batch_id = delivery_batch.batch_id
        WHERE d.assignedToEmp = ${nums[1]}
        AND o.status = “in transit”
        ORDER BY i.index ASC;`);

    let storeInfo = await runQuery(employeePool, `SELECT * FROM store s WHERE s.store_id = "${nums[0]}"`);

    // Checks that the employee is assigned to the store
    if (storeInfo.length != 1) {
        res.writeHead(404, { 'Content-type': 'text/plain' });
        res.end(`Store with storeId ${nums[0]} not found.`);
    }

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.write(JSON.stringify(orders));
    res.end();
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
            path: /^\/directions\/[\d]+\/[\d]+$/,
            handler: handleAuth(authRoles.employee, getOrders)
        },
        {
            method: 'POST',
            path: /^\/directions\/waypoints\/[\d]$/,
            handler: handleWorksAt(getRouteWaypoints)
        }
    ]
}