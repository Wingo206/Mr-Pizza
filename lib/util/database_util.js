const mysql = require('mysql2');
const config = require('./config');

let pools = [];
let usernames = [config.sqlAuthUser, config.sqlVisitorUser, config.sqlCustomerUser,
config.sqlEmployeeUser, config.sqlAdminUser];
let passwords = [config.sqlAuthPw, config.sqlVisitorPw, config.sqlCustomerPw,
config.sqlEmployeePw, config.sqlAdminPw];

for (let i = 0; i < usernames.length; i++) {
   let pool = mysql.createPool({
      connectionLimit: 5,
      host: config.sqlHost,
      user: usernames[i],
      password: passwords[i],
      database: config.database,
   })
   pools.push(pool);
}

async function setupConnections() {

   for (let i = 0; i < pools.length; i++) {
      await new Promise(resolve => {
         pools[i].getConnection((err, connection) => {
            if (err) throw err;
            console.log(usernames[i] + ' connected successfully');
            connection.release();
            resolve();
         })
      })
   }

   // check if all the pools were successful
   if (pools.length < usernames.length) {
      console.log(pools)
      throw new Error("Connection pools were not initialized properly.");
   }

   // test
   let res = await runQuery(pools[0], "select * from store where address = ?", "busch student center!");
   console.log(res);

}


function runQuery(connectionPool, queryString, ...values) {
   return new Promise(resolve => {
      connectionPool.query(queryString, ...values, (err, data) => {
         if (err) throw err;
         resolve(data);
      })
   })
}

/**
 * converts a date object into a string that can be stored under the datetime datatype
 */
function dateToDb(dateObj) {
   return dateObj.toISOString().slice(0, 19).replace('T', ' ');
}

setupConnections();

module.exports = {
   authPool: pools[0],
   visitorPool: pools[1],
   customerPool: pools[2],
   employeePool: pools[3],
   adminPool: pools[4],
   runQuery,
   dateToDb
};
