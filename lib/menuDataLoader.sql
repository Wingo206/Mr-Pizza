use mrpizza;

INSERT INTO store (store_id, address, image_url)
VALUES
('0','340 Ryders Ln, Milltown, NJ 08850','https://cdn.iconscout.com/icon/premium/png-256-thumb/pizza-shop-3-1104611.png?f=webp');

INSERT INTO menu_item (mid, price, image_url, description)
VALUES
('1', '7.99','https://t4.ftcdn.net/jpg/02/11/55/17/360_F_211551718_Ol7eOQYNDK5S8pbEHMkagk9kbdYTJ2iX.jpg','Pizza'),
('2', '7.99', 'https://t4.ftcdn.net/jpg/01/38/44/27/360_F_138442706_pFbCaNfUlo0pDbnVEq7tId7WWT8E0o8f.jpg', 'Antipasta'),
('3', '2.00', 'https://cdn-icons-png.freepik.com/256/8765/8765032.png', 'Soda');

INSERT INTO item_availability (mid, store_id, available)
VALUES
('1','0','1'),
('2','0','0'),
('3','0','1');

INSERT INTO topping (topping_name, mid, price)
VALUES
('Pepperoni', '1','0.25'),
('Pineapple', '2','0.25'),
('Watermelon', '3','0.25'),
('Ice-Cream', '4','0.25'),
('French-Fry', '5','0.25');

INSERT INTO topping_availability (topping_name, mid, store_id, available)
VALUES
('Pepperoni', '1','0','1'),
('Pineapple', '2','0','1'),
('Watermelon', '3','0','1'),
('Ice-Cream', '4','0','0'),
('French-Fry', '5','0','1');