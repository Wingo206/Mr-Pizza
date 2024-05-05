const {handleAuth, authRoles, handleWorksAt} = require("../authApi");
const {runQuery, employeePool, customerPool} = require("../util/database_util");
const {getJSONBody} = require('../util/inputValidationUtil.js');

/**
 * api endpoint that updates the database each time the position of the order is updated
 * uri: /geolocation/updatePos
 */
async function updateOrderPos(req, res, jwtBody) {
    let decodedData = await getJSONBody(req, res, ['latlng']);
    if (!decodedData || !decodedData.hasOwnProperty('latlng')) {
        return;
    }

    console.log(decodedData.latlng);

    if (!decodedData.latlng.hasOwnProperty('lat') || !decodedData.latlng.hasOwnProperty('lng')) {
        res.writeHead(400, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Invalid latlng."}));
        return;
    }

    let updateRes = await runQuery(employeePool,
        `update delivery_batch set current_latlng = POINT(?, ?) where assignedToEmp = ${jwtBody.id}`,
        [decodedData.latlng.lat, decodedData.latlng.lng]);

    if (updateRes.affectedRows == 0) {
        res.writeHead(404, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "You are not assigned any delivery batch."}));
        return;
    }
    // debugging
    console.log(updateRes);

    res.writeHead(200, {'Content-type': 'application/json'});
    res.end("Successfully updated driver location.");
}

/**
 * api endpoint that fetches the order's/delivery driver's current position for driver view
 * uri: /geolocation/fetchPosEmployee
 */
async function getOrderPosEmployee(req, res, jwtBody) {
    let queryRes = await runQuery(employeePool,
        `select b.current_latlng
        from delivery_batch b
        where b.assignedToEmp = ${jwtBody.id}
        and b.batch_id in (
            select distinct ib.batch_id
            from in_batch ib
            join customer_order co on ib.order_id = co.order_id
            where co.status = "In-Transit"
        )
        limit 1
        `);

    res.writeHead(200, {'Content-type': 'application/json'});
    res.end(JSON.stringify(queryRes));
}

async function getOrderPosCustomer(req, res, jwtBody) {
    let queryRes = await runQuery(customerPool,
        `select current_latlng
        from customer_order c
        join in_batch i on i.order_id = c.order_id
        join delivery_batch d on d.batch_id = i.batch_id
        where c.ordered_by = ${jwtBody.id}
        order by DT_created desc
        limit 1`);

    if (queryRes.length == 0) {
        res.writeHead(404, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "You do not have any In-Transit orders."}));
        return;
    }

    res.writeHead(200, {'Content-type': 'application/json'});
    res.end(JSON.stringify(queryRes[0]));
}

/**
 * could merge with above function to reduce redundancy
 */
async function getCustomerPos(req, res, jwtBody) {
    let queryRes = await runQuery(customerPool,
        `select c.delivery_latlng
        from customer_order c
        where c.ordered_by = ${jwtBody.id}
        and c.status = 'In-Transit'
        order by DT_created desc
        limit 1
        `);
    if (queryRes.length == 0) {
        res.writeHead(404, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "You do not have any In-Transit orders."}));
        return;
    }

    res.writeHead(200, {'Content-type': 'application/json'});
    res.end(JSON.stringify(queryRes[0]));
}

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/geolocation/updatePos',
            handler: handleAuth(authRoles.employee, updateOrderPos)
        },
        {
            method: 'GET',
            path: '/geolocation/fetchOrderPosEmployee',
            handler: handleAuth(authRoles.employee, getOrderPosEmployee)
        },
        {
            method: 'GET',
            path: '/geolocation/fetchOrderPosCustomer',
            handler: handleAuth(authRoles.customer, getOrderPosCustomer)
        },
        {
            method: 'GET',
            path: '/geolocation/fetchCustomerPos',
            handler: handleAuth(authRoles.customer, getCustomerPos)
        }
    ]
}
