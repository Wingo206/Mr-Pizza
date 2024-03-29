/*
   * First order of business - Make a false cart with a list of items. You can do this by making a list, and displaying it, filling it with items and price
   * Next, start implementing Stripe API. As soon as a customer hits a checkout button with a cart, they will be taken to a new menu. On the left side of the screen, there will be a preview of the items, quantity of items, and price of each item. 
   * On the right side, we will be able to see the Stripe payment menu. It should list the total price, and should have the customer input their information for now. This can be autofilled once an account comes in. If we do it like this, we might need to update System Sequence Diagram Later.
   * After customer pays, we should display a order success or order fail based on payment validation checks (handled by stripe????). 
   * At that moment, the customer will receive a notification through SMS/Email with Twilio API
   * Then, the customer will be automatically redirected to Order Status menu, which will display the order that they just submitted, along with their payment information (censor credit card stuff). Then, we will have buttons to take the to map to see their driver, or a button to take them to the live pizza tracker. They will be placeholders for now.
*/

const mysql = require("mysql2");

async function handleOrder(req, res) {
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

   let data = '';

   req.on('data', chunk => {
       data += chunk;
   });

   // Parse the received data once all chunks are received
   req.on('end', () => {
      try {
         // Parse JSON data
         const jsonData = JSON.parse(data);

         // Access orderData, menuItemData, and orderItemData arrays
         const { orderData, menuItemData, orderItemData } = jsonData;

         // Insert into customer_order table
         const customerOrderValues = orderData.map(order => {
             return [
                 order.credit_card,
                 order.status,
                 order.total_price,
                 order.delivery_address,
                 order.DT_created,
                 order.DT_delivered,
                 order.ordered_by
             ];
         });
         const customerOrderQuery = 'INSERT INTO customer_order (credit_card, status, total_price, delivery_address, DT_created, DT_delivered, ordered_by) VALUES ?';
         let orderId = 0;
         con.query(customerOrderQuery, [customerOrderValues], (err, result) => {
             if (err) {
                 console.error('Error inserting into customer_order:', err);
                 res.writeHead(500, { 'Content-type': 'text/plain' });
                 res.write('Error inserting into customer_order');
                 res.end();
                 return;
             }
            orderId = result.insertId;
            console.log(orderId);
            console.log(result);
            console.log('Inserted into customer_order:', result);

            const orderItemValues = orderItemData.map(item => {
               return [orderId, item.mid];
            });
            console.log(orderItemValues);
            const orderItemQuery = 'INSERT INTO order_item (order_id, mid) VALUES ?';
            con.query(orderItemQuery, [orderItemValues], (err, result) => {
               if (err) {
                     console.error('Error inserting into order_item:', err);
                     res.writeHead(500, { 'Content-type': 'text/plain' });
                     res.write('Error inserting into order_item');
                     res.end();
                     return;
               }
               console.log('Inserted into order_item:', result);
            });  
         });

         //Prolly don't need this later when menu items established 
         // Insert into menu_item table
         const menuItemValues = menuItemData.map(item => {
             return [item.price, item.image_url, item.description];
         });
         const menuItemQuery = 'INSERT INTO menu_item (price, image_url, description) VALUES ?';
         con.query(menuItemQuery, [menuItemValues], (err, result) => {
             if (err) {
                 console.error('Error inserting into menu_item:', err);
                 res.writeHead(500, { 'Content-type': 'text/plain' });
                 res.write('Error inserting into menu_item');
                 res.end();
                 return;
             }
             console.log('Inserted into menu_item:', result);
         });

       
         // const orderItemValues = orderItemData.map(item => {
         //    return [orderId, item.mid];
         // });
         // console.log(orderItemValues);
         // const orderItemQuery = 'INSERT INTO order_item (order_id, mid) VALUES ?';
         // con.query(orderItemQuery, [orderItemValues], (err, result) => {
         //     if (err) {
         //         console.error('Error inserting into order_item:', err);
         //         res.writeHead(500, { 'Content-type': 'text/plain' });
         //         res.write('Error inserting into order_item');
         //         res.end();
         //         return;
         //     }
         //     console.log('Inserted into order_item:', result);
         // });

         // Respond to the client
         res.writeHead(200, { 'Content-type': 'text/plain' });
         res.write('Successfully ordered');
         res.end();
     } catch (error) {
         console.error('Error parsing JSON:', error);
         res.writeHead(400, { 'Content-type': 'text/plain' });
         res.write('Error parsing JSON');
         res.end();
     }
 });
}

async function getOrder(req, res) {

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

   // Create a MySQL connection
   var con = mysql.createConnection({
       host: "localhost",
       user: "admin",
       password: "admpw",
       database: "mrpizza"
   });
   
   // Connect to the database
   con.connect((err) => {
       if (err) {
           console.error("Error: " + err.stack);
           return;
       }
       console.log("Connected");
   });

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

       // Execute the query with the specified order_id
       await new Promise((resolve, reject) => {
           con.query(query, [order_id], (err, rows, fields) => {
               if (err) {
                   reject(err);
                   return;
               }
               results = rows;
               resolve();
           });
       });

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
       con.end();
   }
}

async function cancelOrder(req, res) {

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

   // Create a MySQL connection
   var con = mysql.createConnection({
       host: "localhost",
       user: "admin",
       password: "admpw",
       database: "mrpizza"
   });
   
   // Connect to the database
   con.connect((err) => {
       if (err) {
           console.error("Error: " + err.stack);
           return;
       }
       console.log("Connected");
   });

   let results;

    // Update the status of the order to "Cancelled" in the database
    const updateQuery = 'UPDATE customer_order SET status = "Cancelled" WHERE order_id = ?';
    con.query(updateQuery, [order_id], (err, results) => {
        if (err) {
            console.error('Error cancelling order:', err);
            res.status(500).send('Error cancelling order');
            return;
        }
        console.log('Order cancelled successfully');
        res.writeHead(200, {'Content-type': 'text/plain'});
        res.end("Cancelled");
    });

}

module.exports = {
   routes: [
      {
         method: 'POST',
         path: '/order/postOrder',
         handler: handleOrder
      },
      {
         method: 'POST',
         path: '/order/getOrder',
         handler: getOrder
      },
      {
         method: 'POST',
         path: '/order/cancelOrder',
         handler: cancelOrder
      }
   ]
};
