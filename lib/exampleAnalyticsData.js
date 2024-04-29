const {authRoles, registerAccount} = require("./authApi");
const {loadMenu, makeAllAvailable} = require("./scraping/loadMenu");
const {adminPool, runQuery, dateToDb, resetDatabase} = require("./util/database_util");

/**
 * creates random date between two things
 */
function randomDate(start, end, startHour, endHour) {
   var date = new Date(+start + Math.random() * (end - start));
   var hour = startHour + Math.random() * (endHour - startHour) | 0;
   date.setHours(hour);
   return date;
 }


/**
 * creates random customer accounts, orders, order items, and customizations.
 */
async function generateExampleAnalyticsData() {
   // get store ids
   let storeIds = await runQuery(adminPool,
      `SELECT store_id FROM store`)
   storeIds = storeIds.map(c => c.store_id);

   // generate customers
   let customers = [];
   for (let i = 0; i < 100; i++) {
      customers.push([
         'exampleUser' + i,
         'password_hash'
      ]);
   }
   let res = await runQuery(adminPool,
      `INSERT INTO customer_account(username, password_hash) VALUES ?`, [customers]);
   console.log(res.info);

   let exampleUserCids = await runQuery(adminPool,
      `SELECT cid FROM customer_account WHERE username LIKE "exampleUser%"`)
   exampleUserCids = exampleUserCids.map(c => c.cid);

   // generate orders
   let orders = [];
   for (let i = 0; i < 500; i++) {
      // 90% chance to create an order
      if (Math.random() > 0.9) {
         continue;
      }

      // select a random cid
      let selectedCid = exampleUserCids[Math.floor(Math.random() * exampleUserCids.length)];
      let selectedStoreId = storeIds[Math.floor(Math.random() * storeIds.length)];
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date();
      orders.push([
         (Math.random() < 0.95) ? 'Completed' : 'Rejected',
         selectedStoreId,
         selectedCid,
         dateToDb(randomDate(startDate, endDate, 0, 24))
      ]);
   }
   let res2 = await runQuery(adminPool,
      `INSERT INTO customer_order(status, made_at, ordered_by, DT_created) VALUES ?`, [orders]);
   console.log(res2.info)

   // for each order, add random items and calculate the total price
   let mids = await runQuery(adminPool,
      `SELECT mid FROM menu_item`)
   mids = mids.map(m => m.mid);
   let orderIds = await runQuery(adminPool,
      `SELECT order_id 
      FROM customer_order co
      JOIN customer_account ca ON co.ordered_by = ca.cid
      WHERE ca.username LIKE "exampleUser%"`)
   orderIds = orderIds.map(o => o.order_id);
   let items = [];
   for (let i = 0; i < orderIds.length; i++) {
      let addItem = true;
      while (addItem) {
         let selectedMid = mids[Math.floor(Math.random() * mids.length)];
         items.push([
            orderIds[i],
            selectedMid
         ])

         addItem = Math.random() > 0.5; // 50% chance to add another item
      }
   }
   let res3 = await runQuery(adminPool,
      `INSERT INTO order_item(order_id, mid) VALUES ?`, [items]);
   console.log(res3.info);

   // for each item, select a random set of customizations
   let itemsInfo = await runQuery(adminPool,
      `SELECT co.order_id, item_num, mid
      FROM order_item oi
      JOIN customer_order co on co.order_id = oi.order_id
      JOIN customer_account ca ON co.ordered_by = ca.cid
      WHERE ca.username LIKE "exampleUser%"`)
   let withCustoms = [];
   for (let i = 0; i < itemsInfo.length; i++) {
      // figure out the customization options
      let mutExCustomizations = await runQuery(adminPool,
         `SELECT custom_name
         FROM custom c
         WHERE c.mid= ${itemsInfo[i].mid}
         AND c.mutually_exclusive = TRUE`)
      // choose a random option for these
      for (let j = 0; j < mutExCustomizations.length; j++) {
         let selection = await runQuery(adminPool,
            `SELECT option_name 
            FROM custom_option
            WHERE custom_name = ?
            AND mid = ?
            ORDER BY RAND()
            LIMIT 1`, [mutExCustomizations[j].custom_name, itemsInfo[i].mid])
         withCustoms.push([
            itemsInfo[i].order_id,
            itemsInfo[i].item_num,
            itemsInfo[i].mid,
            mutExCustomizations[j].custom_name,
            selection[0].option_name
         ]);
      }

      // select 0-5 non mut exclusive options
      let selection = await runQuery(adminPool,
         `SELECT co.option_name, co.custom_name
         FROM custom_option co
         JOIN custom c on c.custom_name = co.custom_name AND c.mid = co.mid
         WHERE c.mid = ?
         AND c.mutually_exclusive = FALSE
         ORDER BY RAND()
         LIMIT ?`,
         [itemsInfo[i].mid, Math.floor(Math.random() * 5)])
      selection.forEach(s => {
         withCustoms.push([
            itemsInfo[i].order_id,
            itemsInfo[i].item_num,
            itemsInfo[i].mid,
            s.custom_name,
            s.option_name
         ])
      })

   }
   if (withCustoms.length > 0) {
      let res4 = await runQuery(adminPool,
         `INSERT INTO with_custom(order_id, item_num, mid, custom_name, option_name) VALUES ?`,
         [withCustoms])
      console.log(res4.info)
   }

   // update prices for the orders now that items and customizations have been added
   let res5 = await runQuery(adminPool,
      `UPDATE customer_order
      JOIN (
      SELECT order_id, COALESCE(toppingPrice, 0) + itemPrice AS totalPrice FROM
      (SELECT itemSubtable.order_id, toppingPrice, itemPrice FROM 
          (SELECT wc.order_id, SUM(co.price) toppingPrice
          FROM with_custom wc
          JOIN custom_option co ON wc.mid = co.mid AND wc.custom_name = co.custom_name AND wc.option_name = co.option_name
          GROUP BY wc.order_id) toppingSubtable
      RIGHT OUTER JOIN
          (SELECT oi.order_id, SUM(m.price) itemPrice
          FROM order_item oi
          JOIN menu_item m ON oi.mid = m.mid
          GROUP BY oi.order_id) itemSubtable
      ON toppingSubtable.order_id = itemSubtable.order_id) t
      ) t2
      ON customer_order.order_id = t2.order_id
      SET customer_order.total_price = t2.totalPrice
      WHERE customer_order.order_id = t2.order_id`)
   console.log(res5.info);

}

module.exports = {
   generateExampleAnalyticsData
}
