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

}

function runQuery(connectionPool, queryString) {
   return new Promise(resolve => {
      connectionPool.query(queryString, (err, data) => {
         if (err) throw err;
         resolve(data);
      })
   })
}

setupConnections();

module.exports = {
   authPool: pools[0],
   visitorPool: pools[1],
   customerPool: pools[2],
   employeePool: pools[3],
   adminPool: pools[4],
   runQuery
};
