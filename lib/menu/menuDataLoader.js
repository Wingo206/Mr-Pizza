const {runQuery, adminPool} = require('../util/database_util');
async function menuDataLoader() {
    await runQuery(adminPool, 'use mrpizza;');
    await runQuery(adminPool, "INSERT INTO store (store_id, address, latlng, image_url) VALUES ('1','340 Ryders Ln, Milltown, NJ 08850',point(40.523421858838276, -74.45823918823967),'https://cdn.iconscout.com/icon/premium/png-256-thumb/pizza-shop-3-1104611.png?f=webp');");
    await runQuery(adminPool, "INSERT INTO menu_item (mid, price, image_url, description) VALUES ('1', '7.99','https://t4.ftcdn.net/jpg/02/11/55/17/360_F_211551718_Ol7eOQYNDK5S8pbEHMkagk9kbdYTJ2iX.jpg','Pizza'),('2', '8.99', 'https://media.istockphoto.com/id/166757566/vector/pizza-icon.jpg?s=612x612&w=0&k=20&c=HSxOJBRc5vjtjDAfUS2DYjOrPh9IRxvW3LblGOG9eW0=', 'Square-Pizza'),('3', '7.99', 'https://t4.ftcdn.net/jpg/01/38/44/27/360_F_138442706_pFbCaNfUlo0pDbnVEq7tId7WWT8E0o8f.jpg', 'Antipasta'),('4', '2.00', 'https://cdn-icons-png.freepik.com/256/8765/8765032.png', 'Soda');")
    await runQuery(adminPool, "INSERT INTO item_availability (mid, store_id, available) VALUES ('1','1','1'),('2','1','0'),('3','1','1'),('4','1','1');");
    await runQuery(adminPool, "INSERT INTO topping (topping_name, mid, price) VALUES ('Pepperoni', '1','0.25'),('Sausage', '1','0.25'),('Bacon', '1','0.25'),('Chicken', '1', '0.25'),('Mushroom', '1','0.25'),('Bell-Pepper', '1','0.25'),('Pineapple', '1','0.25'),('Watermelon', '1','0.25'),('Ice-Cream', '1','0.25'),('French-Fry', '1','0.25'),('Baked-Ziti', '1', '0.25');")
    await runQuery(adminPool, "INSERT INTO topping_availability (topping_name, mid, store_id, available) VALUES ('Pepperoni', '1','1','1'),('Sausage', '1','1','1'),('Bacon', '1','1','1'),('Chicken', '1','1','1'),('Mushroom', '1','1','1'),('Bell-Pepper', '1','1','1'),('Pineapple', '1','1','1'),('Watermelon', '1','1','1'),('Ice-Cream', '1','1','0'),('French-Fry', '1','1','1'),('Baked-Ziti', '1','1','1');")
}
if (require.main === module) {
    menuDataLoader();
}