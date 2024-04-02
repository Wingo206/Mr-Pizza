const {adminPool, runQuery, dateToDb} = require("../util/database_util");

// Add in some example locations
async function addValues() {
   await runQuery(adminPool, 'DELETE FROM store');
   await runQuery(adminPool, `alter table store AUTO_INCREMENT = 1`)
   await runQuery(adminPool, 'INSERT INTO store(address, latlng) values' +
      '("busch student center", point(40.523421858838276, -74.45823918823967)), ' +
      '("livingston student center", point(40.52362753497832, -74.43692635431962))'
   )
   let buschStoreIdRes = await runQuery(adminPool, `select store_id from store where address = "${'busch student center'}"`)
   let buschStoreId = buschStoreIdRes[0].store_id;
   console.log(buschStoreId)
   // setup driver employees
   await runQuery(adminPool, `delete from employee_account where name = "d1"`);
   await runQuery(adminPool, `delete from employee_account where name = "d2"`);
   await runQuery(adminPool, `alter table employee_account AUTO_INCREMENT = 2`)
   await runQuery(adminPool,
      `insert into employee_account(name, employee_type, email, password_hash, status, works_at) values 
      ("d1", "driver", "d1@mrpizza.com", "password", "idle", ${buschStoreId}),
      ("d2", "driver", "d2@mrpizza.com", "password", "idle", ${buschStoreId}) `);
   // setup customers
   await runQuery(adminPool, `delete from customer_account where username like "%deliveryCust%"`);
   await runQuery(adminPool,
      `insert into customer_account(username, password_hash) values
      ("deliveryCust1", "password"),
      ("deliveryCust2", "password") `);
   let custIds = (await runQuery(adminPool, `select cid from customer_account c where c.username like "%deliveryCust%"`)).map(a => a.cid)
   console.log(custIds)
   // create some orders
   await runQuery(adminPool, `delete from customer_order`);
   await runQuery(adminPool, `alter table customer_order AUTO_INCREMENT = 1`);

   await runQuery(adminPool, 
      `insert into customer_order(status, delivery_latlng, DT_created, ordered_by, made_at) values
      ("In-Transit", POINT(40.41829236146375, -74.70639548636213), "${dateToDb(new Date())}", ${custIds[0]}, 1),
      ("In-Transit", POINT(40.42837937050338, -74.67260209649424), "${dateToDb(new Date())}", ${custIds[1]}, 1),
      ("In-Transit", POINT(40.42837937050338, -74.63260209649424), "${dateToDb(new Date())}", ${custIds[1]}, 1),
      ("In-Transit", POINT(40.6573258481948, -74.3632707679412), "${dateToDb(new Date())}", ${custIds[1]}, 1),
      ("In-Transit", POINT(40.646906977241095, -74.34146977403721), "${dateToDb(new Date())}", ${custIds[1]}, 1),
      ("In-Transit", POINT(40.6622742419765, -74.31554890726946), "${dateToDb(new Date())}", ${custIds[1]}, 1),
      ("In-Transit", POINT(40.45837937050338, -74.67260209649424), "${dateToDb(new Date())}", ${custIds[1]}, 2),
      ("Delivered", POINT(40.48837937050338, -74.67260209649424), "${dateToDb(new Date())}", ${custIds[1]}, 1)`)

   await runQuery(adminPool, 'insert into order_item(order_id, mid) values (1, 1)');
   await runQuery(adminPool, 'insert into order_item(order_id, mid) values (2, 1)');
   await runQuery(adminPool, 'insert into order_item(order_id, mid) values (3, 1)');
   await runQuery(adminPool, 'insert into order_item(order_id, mid) values (4, 1)');
   await runQuery(adminPool, 'insert into order_item(order_id, mid) values (5, 1)');
   await runQuery(adminPool, 'insert into order_item(order_id, mid) values (6, 1)');
   await runQuery(adminPool, 'insert into order_item(order_id, mid) values (7, 1)');
   await runQuery(adminPool, 'insert into order_item(order_id, mid) values (8, 1)');
}


if (require.main === module) {
   addValues();
}

module.exports = {
   addValues,
}
