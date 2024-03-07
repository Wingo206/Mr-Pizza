const mysql = require('mysql2');
const config = require('./config');

let authPool = mysql.createPool({
   connectionLimit: 5,
   host: config.sqlHost,
   user: config.sqlAuthUser,
   password: config.sqlAuthPw,
   database: config.database,
})

authPool.getConnection((err, connection) => {
   if (err) throw err;
   console.log('Auth connected successfully');
   connection.release();
})

let customerPool = mysql.createPool({
   connectionLimit: 5,
   host: config.sqlHost,
   user: config.sqlCustomerUser,
   password: config.sqlCustomerPw,
   database: config.database,
})

customerPool.getConnection((err, connection) => {
   if (err) throw err;
   console.log('Customer connected successfully');
   connection.release();
})

function runQuery(connectionPool, queryString) {
   return new Promise(resolve => {
      connectionPool.query(queryString, (err, data) => {
         if (err) throw err;
         resolve(data);
      })
   })
}

// async function test() {
//    data = await runQuery(authPool, 'select * from customer_account')
//    console.log(data)
//    data = await runQuery(authPool, 'insert into customer_account(username) values ("bob")')
//    console.log(data)
//    data = await runQuery(authPool, 'select * from customer_account')
//    console.log(data)
// }
// test();

module.exports = { authPool, customerPool, runQuery };

