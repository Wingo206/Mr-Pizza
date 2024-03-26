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

    let results;
    
    await new Promise(resolve => {
        //connect three tables together to show all the orders maybe??
        con.query("SELECT co.order_id, " + 
        "       co.status, " + 
        "       co.DT_created AS date_created, " + 
        "       co.total_price, " + 
        "       oi.item_num, " + 
        "       mi.price AS item_price, " + 
        "       mi.description AS item_description " + 
        "FROM customer_order AS co " + 
        "LEFT JOIN order_item AS oi ON co.order_id = oi.order_id " + 
        "LEFT JOIN menu_item AS mi ON oi.mid = mi.mid", 
  function(err, rows, fields) {
      if (err) throw err;
      results = rows;
      resolve();
});


    });      

    console.log(results);

    //testing frontend to backend idea
    let result = [
        {itemName: 'pizza', quantity: 2, pricePerItem: 11.99, totalCostOfEntry: 23.98},
        {itemName: 'wings', quantity: 1, pricePerItem: 6.99, totalCostOfEntry: 6.99}
    ];

    res.writeHead(200, {'Content-type': 'application/json'});
    res.end(JSON.stringify(results));

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