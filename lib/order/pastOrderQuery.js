const mysql = require("mysql2");



// create table order_item(item_num int auto_increment, order_id int not null, mid int not null,
//     primary key(item_num, order_id, mid),
//     foreign key(mid) references menu_item(mid),
//     foreign key(order_id) references customer_order(order_id));

// Example Stripe checkout session creation
async function queryPast(req, res) {
    //admin'@'localhost' identified by 'admpw';
    var con = mysql.createConnection({
        host: "localhost",
        user: "admin",
        password: "admpw",
        database: "mrpizza"
    });
    
    con.connect((err) => {
        if (err) {
        console.error("Error: " + err.stack);
        return;
        }
        console.log("Connected");
    });

    // con.promise().query("SELECT * FROM order_item", function (err, result, fields) {
    //     if (err) throw err;
    //     console.log(result);
    // });

        // con.query("SELECT * FROM order_item")
        //     .then(([rows, fields]) => {
        //     console.log(rows);
        // })
        //     .catch(err => {
        //     console.error(err);
        // });

    let result = [
        {itemName: 'pizza', quantity: 2, pricePerItem: 11.99, totalCostOfEntry: 23.98},
        {itemName: 'wings', quantity: 1, pricePerItem: 6.99, totalCostOfEntry: 6.99}
    ];

    res.writeHead(200, {'Content-type': 'application/json'});
    res.end(JSON.stringify(result));

}

module.exports = {
    routes: [
        // Your existing routes...
        {
            method: 'GET',
            path: '/order/getPastOrders',
            handler: queryPast
        },
        // Add more routes as needed for order handling and Twilio notifications
    ]
};