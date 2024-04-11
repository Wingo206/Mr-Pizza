const mysql = require("mysql2");
const {authRoles, handleAuth} = require('../authApi');
const {adminPool, runQuery} = require("../util/database_util");


// create table order_item(item_num int auto_increment, order_id int not null, mid int not null,
//     primary key(item_num, order_id, mid),
//     foreign key(mid) references menu_item(mid),
//     foreign key(order_id) references customer_order(order_id));

// Example Stripe checkout session creation
async function queryPast(req, res, jwtBody) {
    //admin'@'localhost' identified by 'admpw';
    // var con = mysql.createConnection({
    //     host: "localhost",
    //     user: "admin",
    //     password: "admpw",
    //     database: "mrpizza"
    // });
    
    // con.connect((err) => {
    //     if (err) {
    //     console.error("Error: " + err.stack);
    //     return;
    //     }
    //     console.log("Connected");
    // });
    
    console.log(jwtBody);

    let employeeID = jwtBody.id;

    console.log(employeeID);

    let storequery = "SELECT works_at FROM employee_account WHERE eid = " + employeeID;

    let storeID = await runQuery(adminPool, storequery);
    
    storeID = storeID[0].works_at

    //storeID = 5;

    console.log(storeID);

    let query = "SELECT co.order_id, " + 
    "       co.status, " + 
    "       co.DT_created AS date_created, " + 
    "       co.total_price, " + 
    "       oi.item_num, " + 
    "       mi.price AS item_price, " + 
    "       mi.description AS item_description " + 
    "FROM customer_order AS co " + 
    "LEFT JOIN order_item AS oi ON co.order_id = oi.order_id " + 
    "LEFT JOIN menu_item AS mi ON oi.mid = mi.mid " + 
    "WHERE co.made_at = " + storeID;

    
    let results = await runQuery(adminPool, query);
    
//     await new Promise(resolve => {
//         //connect three tables together to show all the orders maybe??
//         con.query("SELECT co.order_id, " + 
//         "       co.status, " + 
//         "       co.DT_created AS date_created, " + 
//         "       co.total_price, " + 
//         "       oi.item_num, " + 
//         "       mi.price AS item_price, " + 
//         "       mi.description AS item_description " + 
//         "FROM customer_order AS co " + 
//         "LEFT JOIN order_item AS oi ON co.order_id = oi.order_id " + 
//         "LEFT JOIN menu_item AS mi ON oi.mid = mi.mid", 
//   function(err, rows, fields) {
//       if (err) throw err;
//       results = rows;
//       resolve();
// });


    // });      

    console.log(results);

    //testing frontend to backend idea
    let result = [
        {itemName: 'pizza', quantity: 2, pricePerItem: 11.99, totalCostOfEntry: 23.98},
        {itemName: 'wings', quantity: 1, pricePerItem: 6.99, totalCostOfEntry: 6.99}
    ];

    res.writeHead(200, {'Content-type': 'application/json'});
    res.end(JSON.stringify(results));
}

async function updateOrderStatus(req, res) {
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
     let order_id = decodedData.order_id;
     let newStatus = decodedData.newStatus;

     console.log(order_id, newStatus);

    if (!order_id || !newStatus) {
        res.writeHead(400, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: 'Missing order_id or newStatus in request'}));
        return;
    }

    const query = 'UPDATE customer_order SET status = ? WHERE order_id = ?';

    try {
        const result = await runQuery(adminPool, query, [newStatus, order_id]);
        if (result.affectedRows && result.affectedRows > 0) {
            res.writeHead(200, {'Content-type': 'application/json'});
            res.end(JSON.stringify({success: true, message: 'Order status updated successfully'}));
        } else {
            res.writeHead(404, {'Content-type': 'application/json'});
            res.end(JSON.stringify({error: 'Order not found'}));
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: 'Error updating order status'}));
    }
}

module.exports = {
    routes: [
        // Your existing routes...
        {
            method: 'GET',
            path: '/order/getPastOrders',
            handler: handleAuth(authRoles.employee, queryPast)
        },
        {
            method: 'POST',
            path: '/order/setStatus',
            handler: handleAuth(authRoles.employee, updateOrderStatus)
        }
    ]
};