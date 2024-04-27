/*
   * First order of business - Make a false cart with a list of items. You can do this by making a list, and displaying it, filling it with items and price
   * Next, start implementing Stripe API. As soon as a customer hits a checkout button with a cart, they will be taken to a new menu. On the left side of the screen, there will be a preview of the items, quantity of items, and price of each item.
   * On the right side, we will be able to see the Stripe payment menu. It should list the total price, and should have the customer input their information for now. This can be autofilled once an account comes in. If we do it like this, we might need to update System Sequence Diagram Later.
   * After customer pays, we should display a order success or order fail based on payment validation checks (handled by stripe????).
   * At that moment, the customer will receive a notification through SMS/Email with Twilio API
   * Then, the customer will be automatically redirected to Order Status menu, which will display the order that they just submitted, along with their payment information (censor credit card stuff). Then, we will have buttons to take the to map to see their driver, or a button to take them to the live pizza tracker. They will be placeholders for now.
*/
const mysql = require("mysql2");
const {runQuery, customerPool, adminPool} = require("../util/database_util");
const {authRoles, handleAuth} = require('../authApi');
const {isValidAddress} = require('../map/addressApi.js');

async function handleOrder(req, res, jwtBody) {
//    var con = mysql.createConnection({
//       host: "localhost",
//       user: "admin",
//       password: "admpw",
//       database: "mrpizza"
//    });

//    con.connect((err) => {
//       if (err) {
//          console.error("Error: " + err.stack);
//          return;
//       }
//       console.log("Connected");
//    });
   console.log(jwtBody);
   let data = '';

   req.on('data', chunk => {
      data += chunk;
   });

   // Parse the received data once all chunks are received

   let body = await new Promise(resolve => {
      let data = '';
      req.on('data', chunk => {
         data += chunk;
      })
      req.on('end', () => {
         resolve(data);
      })
   });
   // Parse JSON data
   let jsonData;
   try {
      jsonData = JSON.parse(data);
      // TODO verify the fields are legit
   } catch {
      console.error('Error parsing JSON:', error);
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.write('Bad Request: JSON data is malformed and could not be parsed.');
      res.end();
   }

   // Access orderData, menuItemData, and orderItemData arrays
   const {orderData, orderItemData} = jsonData;

   // check the address validity
   let validation = await isValidAddress(orderData[0].delivery_address);
   if (!validation.valid) {
      res.writeHead(422, {'Content-type': 'text/plain'});
      res.end('Unprocessable Entity: Provided delivery address is invalid.');
      return;
   }

   let location = validation.location;

   // Insert into customer_order table
   if (orderData == undefined || orderItemData == undefined) {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.write('Bad Request: Required JSON data fields are missing.');
      res.end();
   }
   else {
   const customerOrderValues = orderData.map(order => {
      return [
         order.made_at,
         order.status,
         order.total_price,
         order.delivery_address,
         // location,
         // mysql.raw(`ST_GeomFromText(?)`, [`POINT(${location.latitude}, ${location.longitude}))`]),
         mysql.raw(`POINT(${location.latitude}, ${location.longitude})`),
         // [[`POINT(?, ?)`location.latitude, location.longitude]],
         // `POINT(${location.latitude}, ${location.longitude})`,
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
   } catch {
      console.error('Error inserting into customer_order:', err);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.write('Internal Server Error: Failed to insert data into customer_order table.');
      res.end();
      return;
   }

   orderId = result.insertId;
   console.log('Inserted ' + orderId +' into customer_order:', result);

   const orderItemValues = orderItemData.map(item => {
      return [orderId, item.mid];
   });
   console.log(orderItemValues);

   const orderItemQuery = 'INSERT INTO order_item (order_id, mid) VALUES ?';
   try {
      result = await runQuery(customerPool, orderItemQuery, [ orderItemValues ]);
   } catch {
      console.error('Error inserting into order_item:', err);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.write('Internal Server Error: Failed to insert data into order_item table.');
      res.end();
      return;
   }
   console.log('Inserted into order_item:', result);
      res.writeHead(200, {'Content-type': 'application/json'});
      res.write(JSON.stringify({orderId: orderId, message: 'Order ' + orderId + ' confirmed, inserted into database'}));
      res.end();
   // const menuItemValues = menuItemData.map(item => {
   //    return [item.price, item.image_url, item.description];
   // });
   // const menuItemQuery = 'INSERT INTO menu_item (price, image_url, description) VALUES ?';
   // con.query(menuItemQuery, [menuItemValues], (err, result) => {
   //    if (err) {
   //       console.error('Error inserting into menu_item:', err);
   //       res.writeHead(500, {'Content-type': 'text/plain'});
   //       res.write('Error inserting into menu_item');
   //       res.end();
   //       return;
   //    }
   //    console.log('Inserted into menu_item:', result);
   // });
   }
}

async function getOrder(req, res, jwtBody) {
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

   let order_id = decodedData.order_id;
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

   console.log("getOrder working");
   console.log(orderToDisplay);

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
                  mi.description AS item_description
           FROM customer_order AS co
           LEFT JOIN order_item AS oi ON co.order_id = oi.order_id
           LEFT JOIN menu_item AS mi ON oi.mid = mi.mid
           WHERE co.order_id = ?
       `;

      results = await runQuery(customerPool, query, [order_id]);
      if (!results || results.length === 0) {
         res.writeHead(404, {'Content-type': 'text/plain'});
         res.write('Not Found: No details available for the specified order.');
         res.end();
         return;
      }
      console.log(results);
      // Send the retrieved order details as JSON response
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify(results));
   } catch (error) {
      console.error("Error:", error.message);
      res.writeHead(500, {'Content-type': 'text/plain'});
      res.end("Error retrieving order details");
   } finally {
      // Close the database connection
      // con.end();
   }
}

async function cancelOrder(req, res, jwtBody) {

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

   let order_id = decodedData.order_id;

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
      orderToDisplay = orderToDisplay[0].order_id;
      order_id = orderToDisplay;
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

      let query = "UPDATE customer_account SET rewards_points = rewards_points - 1 WHERE cid = " + cusID;

      await runQuery(customerPool, query);

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

   let order_id = decodedData.order_id;
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

      console.log(results);

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

      console.log(order_id);

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

      console.log("YOUR REWARD BOY: " + rewardPoint);
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

async function stripeConfirmation(req, res) {
   console.log("Beginning Stripe Confirmation");
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

      res.writeHead(200, {'Content-type': 'application/json'});
      res.end("Stripe confirmation successful.");
  } catch (error) {
      console.error("Error parsing JSON:", error);
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.write("Bad Request: Invalid JSON data received.");
      res.end();
  }

   console.log(decodedData);
}

module.exports = {
   routes: [
      {
         method: 'POST',
         path: '/order/postOrder',
         handler: handleAuth(authRoles.customer, handleOrder)
      },
      {
         method: 'POST',
         path: '/order/getOrder',
         handler: handleAuth(authRoles.customer, getOrder)
      },
      {
         method: 'POST',
         path: '/order/cancelOrder',
         handler: handleAuth(authRoles.customer, cancelOrder)
      },
      {
         method: 'POST',
         path: '/order/checkStatus',
         handler: handleAuth(authRoles.customer, checkStatus)
      },
      {
         method: 'POST',
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
      {
         method: "POST",
         path: '/order/stripeWebhook',
         handler: stripeConfirmation
      }
   ]
};
