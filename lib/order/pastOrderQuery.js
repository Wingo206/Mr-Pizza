const mysql = require("mysql2");
const {authRoles, handleAuth} = require('../authApi');
const {adminPool, runQuery} = require("../util/database_util");

async function queryPast(req, res, jwtBody) {
    let query;

    try {
        if (jwtBody.authRole === 'employee') {
            let employeeID = jwtBody.id;
            let storeQuery = "SELECT works_at FROM employee_account WHERE eid = " + employeeID;
            let storeResult = await runQuery(adminPool, storeQuery);
            if (storeResult.length === 0) {
                res.writeHead(404, {'Content-type': 'text/plain'});
                res.write("Not Found: Employee does not have an assigned store.");
                res.end();
                return;
            }
            let storeID = storeResult[0].works_at;
            query = `SELECT co.order_id, co.status, co.DT_created AS date_created, co.total_price,
                     oi.item_num, mi.price AS item_price, mi.description AS item_description, co.made_at
                     FROM customer_order AS co
                     LEFT JOIN order_item AS oi ON co.order_id = oi.order_id
                     LEFT JOIN menu_item AS mi ON oi.mid = mi.mid
                     WHERE co.made_at = ${storeID}`;
        } else {
            let cusID = jwtBody.id;
            query = `SELECT co.order_id, co.status, co.DT_created AS date_created, co.total_price,
                     oi.item_num, mi.price AS item_price, mi.description AS item_description, co.made_at
                     FROM customer_order AS co
                     LEFT JOIN order_item AS oi ON co.order_id = oi.order_id
                     LEFT JOIN menu_item AS mi ON oi.mid = mi.mid
                     WHERE co.ordered_by = ${cusID}`;
        }

        let results = await runQuery(adminPool, query);
        if (results.length === 0) {
            res.writeHead(404, {'Content-type': 'text/plain'});
            res.write("Not Found: No orders found.");
            res.end();
            return;
        }

        res.writeHead(200, {'Content-type': 'application/json'});
        res.end(JSON.stringify(results));
    } catch (error) {
        console.error("Error:", error.message);
        res.writeHead(500, {'Content-type': 'text/plain'});
        res.end("Internal Server Error: Failed to retrieve past orders.");
    }
}


async function updateOrderStatus(req, res, jwtBody) {
    let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        })
        req.on('end', () => {
            resolve(data);
        })
    });

    let decodedData;
    try {
        decodedData = JSON.parse(body);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        res.writeHead(400, {'Content-type': 'text/plain'});
        res.write('Bad Request: JSON data is malformed and could not be parsed.');
        res.end();
        return;
    }

    let { order_id, newStatus } = decodedData;
    let employeeID = jwtBody.id;

    if (!order_id || !newStatus) {
        res.writeHead(400, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: 'Missing order_id or newStatus in request'}));
        return;
    }

    try {
        const query = 'UPDATE customer_order SET status = ? WHERE order_id = ?';
        let result = await runQuery(adminPool, query, [newStatus, order_id]);

        if (result.affectedRows === 0) {
            res.writeHead(404, {'Content-type': 'application/json'});
            res.end(JSON.stringify({error: 'Order not found'}));
            return;
        }

        // Additional logic to handle made_by updates
        const checkQuery = 'SELECT * FROM made_by WHERE order_id = ? AND eid = ?';
        const query2 = 'INSERT INTO made_by (order_id, eid) VALUES ?';
        let rows = await runQuery(adminPool, checkQuery, [order_id, employeeID]);
        if (rows.length === 0) {
            await runQuery(adminPool, query2, [[[order_id, employeeID]]]);
        }

        res.writeHead(200, {'Content-type': 'application/json'});
        res.end(JSON.stringify({success: true, message: 'Order status updated successfully'}));
    } catch (error) {
        console.error('Error updating order status:', error);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: 'Internal Server Error: Error updating order status'}));
    }
}


module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/order/getPastOrders',
            handler: handleAuth(authRoles.employee, queryPast)
        },
        {
            method: 'GET',
            path: '/order/getCustomerOrder',
            handler: handleAuth(authRoles.customer, queryPast)
        },
        {
            method: 'POST',
            path: '/order/setStatus',
            handler: handleAuth(authRoles.employee, updateOrderStatus)
        }
    ]
};