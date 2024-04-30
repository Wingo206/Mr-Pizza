const { runQuery, employeePool } = require("../util/database_util");
const { handleWorksAt, handleAuth, authRoles } = require("../authApi.js");
const { queryStoreLatlng } = require("./assignmentApi");
const { getJSONBody } = require("../util/inputValidationUtil.js");

/**
 * api endpoint
 * url: /directions/assignedOrder
 * input: none
 * returns: json array of orders assigned to the employee
 */
async function getAssignedOrders(req, res, jwtBody) {
    // check if the user is a driver
    let roleRes = await runQuery(employeePool,
        `select * from employee_account where employee_type = "driver"`);
    if (roleRes.length == 0) {
        res.writeHead(401, { 'Content-type': 'text/plain' })
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
    // check if the user is a driver
    let roleRes = await runQuery(employeePool,
        `select * from employee_account where eid = ${jwtBody.id} and employee_type = "driver"`);
    if (roleRes.length == 0) {
        res.writeHead(401, { 'Content-type': 'text/plain' })
        res.end('User is not a driver');
        return;
    }

    // checks body
    let decodedData = await getJSONBody(req, res, ['orders']);
    if (!decodedData) {
        return;
    }

    // checks that orders is an array and non-empty
    let orders = decodedData.orders;
    if (!Array.isArray(orders) || orders.length == 0) {
        res.writeHead(400, { 'Content-type': 'text/plain' });
        res.end('non-empty orders array required');
        return;
    }

    // get all the waypoint locations
    let locations = [];

    // add mr pizza location first
    let mrpizzaLatLng = await queryStoreLatlng(storeId);
    locations.push(mrpizzaLatLng);
    for (let i = 0; i < orders.length; i++) {
        let order_id = Number(orders[i]);
        if (!Number.isInteger(order_id)) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Integer required for order_id');
            return;
        }

        let queryRes = await runQuery(employeePool, `select delivery_latlng from customer_order where order_id = ${order_id}`);
        if (queryRes.length == 0) {
            res.writeHead(400, { 'Content-type': 'text/plain' });
            res.end('Invalid order id.');
            return;
        }
        locations.push(queryRes[0].delivery_latlng);
    }
    locations.push(mrpizzaLatLng);

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(locations));
}

/**
 * api endpoint that updates the status of the driver once they start their delivery
 */
async function updateDriverStatus(req, res, jwtBody) {
    let queryRes = await runQuery(employeePool,
        `update employee_account
        set status = "delivering"
        where eid = ${jwtBody.id}
        `);

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(queryRes));
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
        },
        {
            method: 'POST',
            path: '/directions/updateDriver',
            handler: handleAuth(authRoles.employee, updateDriverStatus)
        }
    ]
}