const {adminPool, runQuery, dateToDb} = require("../util/database_util");

// Add in some example menu items
async function addValues() {
    await runQuery(adminPool, `delete from menu_item`);
    await runQuery(adminPool, `alter table menu_item AUTO_INCREMENT = 1`)
    await runQuery(adminPool,
        `INSERT INTO menu_item(price, image_url, description) 
VALUES(9.99, 'https://example.com/image1.jpg', 'Pizza Margherita'),
        (12.99, 'https://example.com/image2.jpg', 'Pepperoni Pizza'),
        (8.99, 'https://example.com/image3.jpg', 'Cheese Pizza')`)

    await runQuery(adminPool, `delete from customer_account`);
    await runQuery(adminPool, `alter table customer_account AUTO_INCREMENT = 1`)
    await runQuery(adminPool,
        `INSERT INTO customer_account (username, default_delivery_address, phone_num, password_hash, email, default_credit_card) VALUES
    ('john_doe', '123 Main St, City, Country', '1234567890', 'password_hash_1', 'john.doe@example.com', '1234567890123456'),
    ('jane_smith', '456 Elm St, Town, Country', '0987654321', 'password_hash_2', 'jane.smith@example.com', '9876543210987654'),
    ('alice_johnson', '789 Oak St, Village, Country', '5555555555', 'password_hash_3', 'alice.johnson@example.com', '1111222233334444')`)
}


if (require.main === module) {
    addValues();
}
