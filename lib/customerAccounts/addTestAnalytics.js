// const {customerPool, runQuery} = require("../util/database_util.js");

// async function addAnalytics(){
//     let credit_card = '1234567890123456';
//     let status = 'ordered';
//     let total_price = 13.42;
//     let delivery_address = '123 Example St, Piscataway, NJ 08854';
//     let delivery_latlng = 'POINT(30.2672 -97.7431)';
//     let DT_created = new Date('2024-5-12');
//     let DT_delivered = new Date('2024-5-12');
//     let ordered_by = 1;
//     let made_at = 1;
//     const query1 = `INSERT INTO customer_order (credit_card, status, total_price, delivery_address, delivery_latlng, DT_created, DT_delivered, ordered_by, made_at) VALUES (?, ?, ?, ?, ST_PointFromText(?), ?, ?, ?, ?)`;
//     let insert1 = await runQuery(customerPool, query1, [credit_card, status, total_price, delivery_address, delivery_latlng, DT_created, DT_delivered, ordered_by, made_at]);
// }

// addAnalytics();