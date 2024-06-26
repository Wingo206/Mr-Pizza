const {authRoles, registerAccount} = require("./authApi");
const {generateExampleAnalyticsData} = require("./exampleAnalyticsData");
const {loadMenu, makeAllAvailable} = require("./scraping/loadMenu");
const {adminPool, runQuery, dateToDb, resetDatabase} = require("./util/database_util");

/**
 * Sets up all example data for the database
 */
async function initData() {
   await resetDatabase();

   // add example accounts
   await registerAccount(authRoles.customer, 'customer1', 'password');
   await registerAccount(authRoles.admin, 'admin@mrpizza.com', 'admin');
   await registerAccount(authRoles.employee, 'employee1@mrpizza.com', 'employee1');


   // set up example stores
   await runQuery(adminPool, `INSERT INTO store(address, name, latlng) values
      ("604 Bartholomew Rd, Piscataway, NJ 08854", "Busch Student Center", point(40.523421858838276, -74.45823918823967)), 
      ("84 Joyce Kilmer Ave, Piscataway, NJ 08854", "Livingston Student Center", point(40.52362753497832, -74.43692635431962))`
   )
   let buschStoreIdRes = await runQuery(adminPool, `select store_id from store where name = "${'busch student center'}"`)
   let buschStoreId = buschStoreIdRes[0].store_id;
   console.log(buschStoreId)

   // setup driver employees
   await registerAccount(authRoles.employee, 'd1@mrpizza.com', 'password');
   await registerAccount(authRoles.employee, 'd2@mrpizza.com', 'password');
   await runQuery(adminPool,
      `update employee_account set 
         employee_type = "driver", 
         status = "idle", 
         works_at = ? 
         where email = "d1@mrpizza.com"`, buschStoreId);
   await runQuery(adminPool,
      `update employee_account set 
         employee_type = "driver", 
         status = "idle", 
         works_at = ? 
         where email = "d2@mrpizza.com"`, buschStoreId);

   // setup customers for map/driver
   await registerAccount(authRoles.customer, 'deliveryCust1', 'password');
   await registerAccount(authRoles.customer, 'deliveryCust2', 'password');
   let custIds = (await runQuery(adminPool, `select cid from customer_account c where c.username like "%deliveryCust%"`)).map(a => a.cid)
   console.log(custIds)

   // create some orders for map/driver
   // await runQuery(adminPool,
   //    `insert into customer_order(status, delivery_latlng, DT_created, ordered_by, made_at) values
   //    ("In-Transit", POINT(40.41829236146375, -74.70639548636213), "${dateToDb(new Date())}", ${custIds[0]}, 1),
   //   ("In-Transit", POINT(40.6622742419765, -74.31554890726946), "${dateToDb(new Date())}", ${custIds[1]}, 1)`)
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

   // await runQuery(adminPool, 'insert into order_item(order_id, mid) values (1, 1)');
   // await runQuery(adminPool, 'insert into order_item(order_id, mid) values (2, 1)');

   // Load the menu
   await loadMenu();
   await makeAllAvailable(1);


   // test data for pizza pipeline
   await registerAccount(authRoles.customer, 'john_doe', 'password_hash');
   await runQuery(adminPool, `update customer_account set
      phone_num = "1234567890",
      email = "pewdiepie285@gmail.com"
      where username = 'john_doe'`)
   await registerAccount(authRoles.customer, 'jane_smith', 'password_hash_2');
   await runQuery(adminPool, `update customer_account set
      phone_num = "0987654321",
      email = "flacomineryt@gmail.com"
      where username = 'jane_smith'`)
   await registerAccount(authRoles.customer, 'alice_johnson', 'password_hash_3');
   await runQuery(adminPool, `update customer_account set
      phone_num = "5555555555",
      email = "alice.johnson@example.com"
      where username = 'alice_johnson'`)

   // await runQuery(adminPool, "INSERT INTO menu_item (mid, price, image_url, description) VALUES ('1', '7.99','https://t4.ftcdn.net/jpg/02/11/55/17/360_F_211551718_Ol7eOQYNDK5S8pbEHMkagk9kbdYTJ2iX.jpg','Pizza'),('2', '8.99', 'https://media.istockphoto.com/id/166757566/vector/pizza-icon.jpg?s=612x612&w=0&k=20&c=HSxOJBRc5vjtjDAfUS2DYjOrPh9IRxvW3LblGOG9eW0=', 'Square-Pizza'),('3', '7.99', 'https://t4.ftcdn.net/jpg/01/38/44/27/360_F_138442706_pFbCaNfUlo0pDbnVEq7tId7WWT8E0o8f.jpg', 'Antipasta'),('4', '2.00', 'https://cdn-icons-png.freepik.com/256/8765/8765032.png', 'Soda');")
   // await runQuery(adminPool, "INSERT INTO item_availability (mid, store_id, available) VALUES ('1','1','1'),('2','1','0'),('3','1','1'),('4','1','1');");
   // await runQuery(adminPool, "INSERT INTO custom (custom_name,mid,mutually_exclusive) VALUES ('topping','1','0'),('size','1','1'),('topping','3','1'),('size','4','1');");
   // await runQuery(adminPool, "INSERT INTO custom_option (option_name, mid, price, custom_name) VALUES ('Extra Cheese','3','1.50','topping'),('small','4','1.00','size'),('large','4','1.00','size'),('Pepperoni', '1','0.25','topping'),('Sausage', '1','0.25','topping'),('Bacon', '1','0.25','topping'),('Chicken', '1', '0.25','topping'),('Mushroom', '1','0.25','topping'),('Bell-Pepper', '1','0.25','topping'),('Pineapple', '1','0.25','topping'),('Small','1','5.99','size'),('Medium','1','7.99','size'),('Large','1','11.99','size');");
   // await runQuery(adminPool, "INSERT INTO custom_availability (option_name, mid, store_id, custom_name, available) VALUES ('Extra Cheese','3','1','topping','1'),('small','4','1','size','1'),('large','4','1','size','0'),('Pepperoni', '1','1','topping','1'),('Sausage', '1','1','topping','1'),('Bacon', '1','1','topping','1'),('Chicken', '1', '1','topping','0'),('Mushroom', '1','1','topping','1'),('Bell-Pepper', '1','1','topping','1'),('Pineapple', '1','1','topping','1'),('Small','1','1','size','1'),('Medium','1','1','size','1'),('Large','1','1','size','0');");
   // await runQuery(adminPool, 'insert into order_item(order_id, mid) values (1, 1)');
   // await runQuery(adminPool, 'insert into order_item(order_id, mid) values (2, 1)');
   //

   // populate example analytics data
   await generateExampleAnalyticsData();
}



if (require.main === module) {
   initData();
}

module.exports = {
   initData,
}

