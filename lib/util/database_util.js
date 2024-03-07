const mysql = require('mysql2');
const config = require('./config');

// let rootPool = mysql.createPool({
//    connectionLimit: 5,
//    host: config.sqlHost,
//    user: config.sqlRootUser,
//    password: config.sqlRootPassword,
//    database: config.database,
//    port: 3306
// })

rootPool.getConnection((err, connection) => {
   if (err) throw err;
   console.log('Database connected successfully');
   connection.release();
})

// async function runQuery(query) {
//     // create connection
//     let con = mysql.createConnection({
//         host: 'localhost',
//         user: 'schedulingServer',
//         password: 'securePassword999!',
//         database: 'patientScheduling'
//     });
//     await new Promise(resolve => con.connect((err) => {
//         if (err) throw err;
//         // console.log("Connected!");
//         resolve();
//     }));
//     // run query
//     results = await new Promise(resolve => {
//         con.query(query, (err, results) => {
//             if (err) throw err;
//             resolve(results);
//         })
//     });
//     // close and return
//     con.close();
//     return results;
// }
module.exports = rootPool;
