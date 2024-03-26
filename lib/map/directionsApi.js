const { runQuery, employeePool } = require("../util/database_util");

async function getOrders(req, res) {
    let orders = await runQuery(employeePool,
        `SELECT delivery_latlng
        FROM in_batch i
        JOIN customer_order o ON in_batch.order_id = customer_order.order_id
        JOIN delivery_batch d ON in_batch.batch_id = delivery_batch.batch_id
        WHERE d.assignedToEmp = ${jwtBody.id}
        AND o.status = “in transit”
        ORDER BY i.index ASC;`);

    res.writeHead(200, {'Content-type': 'application/json'});
    res.write(JSON.stringify(orders));
    res.end();
}

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/directions/order',
            handler: getOrders
        }
    ]
}