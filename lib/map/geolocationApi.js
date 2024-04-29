const {handleAuth, authRoles, handleWorksAt} = require("../authApi");
const { runQuery, employeePool, customerPool } = require("../util/database_util");
const { getJSONBody } = require('../util/inputValidationUtil.js');

/**
 * api endpoint that updates the database each time the position of the order is updated
 * uri: /geolocation/updatePos
 */
async function updateOrderPos(req, res, jwtBody) {
    let decodedData = await getJSONBody(req, res, ['latlng']);
    if (!decodedData || !decodedData.hasOwnProperty('latlng')) {
        return;
    }

    // checks that it is a point (i.e. geography?)
    let latlng = decodedData.latlng;

    let updateRes = await runQuery(employeePool,
        `update delivery_batch set current_latlng = ${latlng} where assignedToEmp = ${jwtBody.id}`);
    
    // debugging
    console.log(updateRes);

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(updateRes));
}

/**
 * api endpoint that fetches the order's/delivery driver's current position for driver view
 * uri: /geolocation/fetchPosEmployee
 */
async function getOrderPosEmployee(req, res, jwtBody) {
    let queryRes = await runQuery(employeePool, 
        `select current_latlng from delivery_batch where assignedToEmp = ${jwtBody.id}`);

    // debugging
    console.log(queryRes);

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(queryRes));
}

async function getOrderPosCustomer(req, res, jwtBody) {
    let queryRes = await runQuery(customerPool, 
        `select current_latlng
        from customer_order c
        join in_batch i on i.order_id = c.order_id
        join delivery_batch d on d.batch_id = i.batch_id`);

    // debugging
    console.log(queryRes);

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify(queryRes));
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
            path: '/geolocation/fetchPosEmployee',
            handler: handleAuth(authRoles.employee, getOrderPosEmployee)
        },
        {
            method: 'GET',
            path: '/geolocation/fetchPosCustomer',
            handler: handleAuth(authRoles.customer, getOrderPosCustomer)
        }
    ]
}