const mysql = require("mysql2");
const {runQuery, customerPool, adminPool} = require("../util/database_util");
const {authRoles, handleAuth} = require('../authApi');
const {isValidAddress} = require('../map/addressApi.js');
const {getJSONBody} = require("../util/inputValidationUtil");

async function handleOrder(req, res, jwtBody) {
    let jsonData = await getJSONBody(req, res, ['orderData', 'orderItemData', 'isDelivery']);
    if (jsonData == undefined) {
        res.writeHead(400, {'Content-type': 'text/plain'});
        res.end('Bad Request: JSON data is missing.');
        return;
    }

    // Extract isAddressNeeded along with other data
    const { orderData, orderItemData, isDelivery } = jsonData;

    let location = { latitude: 0, longitude: 0 };

    if (isDelivery) {
        if (!orderData[0].delivery_address) {
            res.writeHead(422, {'Content-type': 'text/plain'});
            res.end('Unprocessable Entity: No delivery address provided.');
            return;
        }
        let validation = await isValidAddress(orderData[0].delivery_address);
        if (!validation.valid) {
            res.writeHead(422, {'Content-type': 'text/plain'});
            res.end('Unprocessable Entity: Provided delivery address is invalid.');
            return;
        }
        location = validation.location;
    }

    // Insert into customer_order table
    const customerOrderValues = orderData.map(order => {
        return [
            order.made_at,
            order.status,
            order.total_price,
            order.delivery_address || null,  // Use null if address is not needed
            isDelivery ? mysql.raw(`POINT(${location.latitude}, ${location.longitude})`) : null,
            order.DT_created,
            order.DT_delivered,
            jwtBody.id
        ];
    });

    const customerOrderQuery = 'INSERT INTO customer_order (made_at, status, total_price, delivery_address, delivery_latlng, DT_created, DT_delivered, ordered_by) VALUES ?';
    let orderId = 0;

    let result;
    try {
        result = await runQuery(customerPool, customerOrderQuery, [customerOrderValues]);
        orderId = result.insertId;
        console.log('Inserted ' + orderId + ' into customer_order:', result);
    } catch (err) {
        console.error('Error inserting into customer_order:', err);
        res.writeHead(500, {'Content-type': 'text/plain'});
        res.write('Internal Server Error: Failed to insert data into customer_order table.');
        res.end();
        return;
    }

    const orderItemValues = orderItemData.map(item => {
        return [orderId, item.mid];
    });
    console.log(orderItemValues);

    const orderItemQuery = 'INSERT INTO order_item (order_id, mid) VALUES ?';
    try {
        result = await runQuery(customerPool, orderItemQuery, [orderItemValues]);
        console.log('Inserted into order_item:', result);
    } catch (err) {
        console.error('Error inserting into order_item:', err);
        res.writeHead(500, {'Content-type': 'text/plain'});
        res.write('Internal Server Error: Failed to insert data into order_item table.');
        res.end();
        return;
    }

    res.writeHead(200, {'Content-type': 'application/json'});
    res.write(JSON.stringify({ orderId: orderId, message: 'Order ' + orderId + ' confirmed, inserted into database' }));
    res.end();
}


async function getOrder(req, res, jwtBody) {
   let order_id;
   let cusID = jwtBody.id;

   let recentOrderQuery = "SELECT order_id FROM customer_order WHERE ordered_by = " + cusID + " ORDER BY order_id DESC LIMIT 1";

   let orderToDisplay;
   try {
       orderToDisplay = await runQuery(customerPool, recentOrderQuery);
   } catch (error) {
       console.error('Database Error:', error.message);
       res.writeHead(500, {'Content-type': 'text/plain'});
       res.write('Internal Server Error: Failed to execute database query.');
       res.end();
       return;
   }

   if (orderToDisplay === undefined || orderToDisplay.length == 0) {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end("Error retrieving order, no order placed");
      return;
   }

   orderToDisplay = orderToDisplay[0].order_id;
   order_id = orderToDisplay;

   let results;

   try {
      // Query to retrieve the order details for the specified order_id
      const query = `
           SELECT co.order_id,
                  co.status,
                  co.DT_created AS date_created,
                  co.total_price,
                  oi.item_num,
                  mi.price AS item_price,
                  mi.item_name AS item_name
           FROM customer_order AS co
           LEFT JOIN order_item AS oi ON co.order_id = oi.order_id
           LEFT JOIN menu_item AS mi ON oi.mid = mi.mid
           WHERE co.order_id = ?
       `; //double check this query

      results = await runQuery(customerPool, query, [order_id]);
      if (!results || results.length === 0) {
         res.writeHead(404, {'Content-type': 'text/plain'});
         res.write('Not Found: No details available for the specified order.');
         res.end();
         return;
      }
      // Send the retrieved order details as JSON response
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify(results));
   } catch (error) {
      console.error("Error:", error.message);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.end("Error retrieving order details");
   }
}

async function cancelOrder(req, res, jwtBody) {

   let order_id;

   let cusID = jwtBody.id;

   let recentOrderQuery = "SELECT order_id FROM customer_order WHERE ordered_by = " + cusID + " ORDER BY order_id DESC LIMIT 1";

   let orderToDisplay;
   try {
      orderToDisplay = await runQuery(customerPool, recentOrderQuery);
      if (!orderToDisplay || orderToDisplay.length === 0) {
         res.writeHead(404, {'Content-type': 'text/plain'});
         res.write("Not Found: No recent order found for this user.");
         res.end();
         return;
      }
      order_id = orderToDisplay[0].order_id;
   } catch (error) {
      console.error('Database Error:', error.message);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.write('Internal Server Error: Failed to retrieve order data.');
      res.end();
      return;
   }

   orderToDisplay = orderToDisplay[0].order_id;
   order_id = orderToDisplay;

   let results;
   try {
      // Update the status of the order to "Cancelled" in the database
      const updateQuery = 'UPDATE customer_order SET status = "Canceled" WHERE order_id = ?';

      results = await runQuery(adminPool, updateQuery, [order_id]);

      let checkTotalQuery = "SELECT total_price FROM customer_order WHERE order_id = " + order_id;
      let checker;
  
      try {
          checker = await runQuery(customerPool, checkTotalQuery);
      } catch (error) {
          console.error("Failed to update rewards points:", error.message);
          res.writeHead(500, {'Content-type': 'application/json'});
          res.end(JSON.stringify({error: "Internal server error during rewards update"}));
          return;
      }
      
      let orderTotal = checker[0].total_price;
  
      if(orderTotal >= 5) {
         let query = "UPDATE customer_account SET rewards_points = rewards_points - 1 WHERE cid = " + cusID;

         await runQuery(customerPool, query);   
      }
      
      console.log('Order cancelled successfully');
      res.writeHead(200, {'Content-type': 'text/plain'});
      res.write("Order has been successfully cancelled.");
      res.end("Cancelled");
   }
   catch (error) {
      console.error("Error cancelling order:", error.message);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.write('Internal Server Error: Error executing cancellation process.');
      res.end();
   }
}

async function checkStatus(req, res, jwtBody) {

   let order_id;
   let cusID = jwtBody.id;

   let recentOrderQuery = "SELECT order_id FROM customer_order WHERE ordered_by = " + cusID + " ORDER BY order_id DESC LIMIT 1";

   try {
      orderToDisplay = await runQuery(customerPool, recentOrderQuery);
      if (orderToDisplay === undefined || orderToDisplay.length == 0) {
          res.writeHead(404, {'Content-type': 'text/plain'});
          res.write("Not Found: No orders found for this user.");
          res.end();
          return;
      }
  } catch (error) {
      console.error('Database Error:', error.message);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.write('Internal Server Error: Failed to retrieve order data.');
      res.end();
      return;
  }
   orderToDisplay = orderToDisplay[0].order_id;
   order_id = orderToDisplay;

   let results;

   try {
      // Query to retrieve the order details for the specified order_id
      const query = `SELECT status FROM customer_order WHERE order_id = ?`;

      results = await runQuery(customerPool, query, [order_id]);

      if (results === undefined || results.length == 0) {
         res.writeHead(404, {'Content-type': 'text/plain'});
         res.write("Not Found: Order status unavailable, order may not exist.");
         res.end();
         return;
     }

      // Send the retrieved order details as JSON response
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify(results));
   } catch (error) {
      console.error("Error retrieving order status:", error.message);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.write("Internal Server Error: Error querying order status.");
      res.end();
}
}

async function getOrderID(req, res, jwtBody) {

   try {
      let cusID = jwtBody.id;

      let recentOrderQuery = "SELECT order_id FROM customer_order WHERE ordered_by = " + cusID + " ORDER BY order_id DESC LIMIT 1";

      let orderToDisplay = await runQuery(customerPool, recentOrderQuery);
      if (!orderToDisplay || orderToDisplay.length === 0) {
         res.writeHead(404, {'Content-type': 'text/plain'});
         res.write("Not Found: No orders found for this customer.");
         res.end();
         return;
     }
      orderToDisplay = orderToDisplay[0].order_id;
      order_id = orderToDisplay;

      // Send the retrieved order details as JSON response
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify(order_id));
   } catch (error) {
      console.error("Error:", error.message);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.write("Internal Server Error: Failed to retrieve order ID for customer " + cusID + ".");
      res.end();
   }
}

async function getReward(req, res, jwtBody) {
   try {
      let cusID = jwtBody.id;
      let rewardQuery = "SELECT rewards_points FROM customer_account WHERE cid = " + cusID;

      let rewardPoint = await runQuery(customerPool, rewardQuery);
      if (!rewardPoint || rewardPoint.length === 0) {
         res.writeHead(404, {'Content-type': 'text/plain'});
         res.write("Not Found: No rewards found for this customer.");
         res.end();
         return;
     }

      //Send the retrieved order reward points as JSON response
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify(rewardPoint));
   } catch (error) {
      console.error("Error:", error.message);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.write("Internal Server Error: Failed to retrieve reward points for customer " + cusID + ".");
      res.end();
   }
}

async function redeem(req, res, jwtBody) {
   try {
      let cusID = jwtBody.id;

      let query = "UPDATE customer_account SET rewards_points = rewards_points - 5 WHERE cid = " + cusID;

      await runQuery(customerPool, query);

      let redeemText = "Succesfully Redeemed!";
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify(redeemText));

   } catch (error) {
      console.error("Error:", error.message);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.write("Internal Server Error: Error redeeming points for customer " + cusID + ".");
      res.end();
   }

}

async function checkDelivery(req, res, jwtBody) {
   try {
      let cusID = jwtBody.id;

      let query = "SELECT delivery_address FROM customer_order WHERE ordered_by = " + cusID + " ORDER BY order_id DESC LIMIT 1";

      let deliveryAddress = await runQuery(customerPool, query);
      if (!deliveryAddress || deliveryAddress.length === 0) {
          res.writeHead(404, {'Content-type': 'text/plain'});
          res.write("Not Found: No delivery details found for this customer.");
          res.end();
          return;
      }
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify(deliveryAddress));

   } catch (error) {
      console.error("Error:", error.message);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.write("Internal Server Error: Failed to check delivery status for customer " + cusID + ".");
      res.end();
   }
}


module.exports = {
   routes: [
      {
         method: 'POST',
         path: '/order/postOrder',
         handler: handleAuth(authRoles.customer, handleOrder)
      },
      {
         method: 'GET',
         path: '/order/getOrder',
         handler: handleAuth(authRoles.customer, getOrder)
      },
      {
         method: 'POST',
         path: '/order/cancelOrder',
         handler: handleAuth(authRoles.customer, cancelOrder)
      },
      {
         method: 'GET',
         path: '/order/checkStatus',
         handler: handleAuth(authRoles.customer, checkStatus)
      },
      {
         method: 'GET',
         path: '/order/getOID',
         handler: handleAuth(authRoles.customer, getOrderID)
      },
      {
         method: "GET",
         path: '/order/getRewards',
         handler: handleAuth(authRoles.customer, getReward)
      },
      {
         method: "POST",
         path: '/order/redeemRewards',
         handler: handleAuth(authRoles.customer, redeem)
      },
      {
         method: "GET",
         path: '/order/checkOption',
         handler: handleAuth(authRoles.customer, checkDelivery)
      },
   ]
};
