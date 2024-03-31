const mysql = require('mysql2');
const config = require('./config');

let pools = [];

// detect if running through "npm test". If you are, then load 
// the unit testing database instead of the normal one
let database = config.database;
if (process.env.hasOwnProperty('npm_command') && process.env.npm_command == 'test') {
   database = config.unitTestDatabase;
}

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
      database: database,
      multipleStatements: true,
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


function runQuery(connectionPool, queryString, ...values) {
   return new Promise(resolve => {
      connectionPool.query(queryString, ...values, (err, data) => {
         if (err) throw err;
         resolve(data);
      })
   })
}

/**
 * Resets ALL values in the database. Only use this for unit testing.
 */
async function resetDatabase() {
   let adminPool = pools[4];
   let tablesInfo = await runQuery(adminPool, 
   `select TABLE_NAME from INFORMATION_SCHEMA.TABLES
   where TABLE_SCHEMA = "${database}" `)
   await runQuery(adminPool, `set FOREIGN_KEY_CHECKS = 0`);
   let query = tablesInfo.map(e => `truncate table ${e.TABLE_NAME};`).join('');
   await runQuery(adminPool, query);
   await runQuery(adminPool, `set FOREIGN_KEY_CHECKS = 1`);

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
   dateToDb,
   resetDatabase,
};
