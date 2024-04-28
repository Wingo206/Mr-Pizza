const {handleAuth, authRoles} = require("../authApi.js");
const {customerPool, runQuery} = require("../util/database_util.js");

// updates a customers account info
async function customerInfo(req, res, jwtBody) {
   // console.log("Hello: " + jwtBody);
   const contentType = req.headers['content-type'];
   if (contentType != 'application/json') {
      res.writeHead(415, {'Content-Type': 'text/plain'});
      res.end('json body required');
      return;
   }

   let body = await new Promise(resolve => {
      let data = '';
      req.on('data', chunk => {
         data += chunk;
      })
      req.on('end', () => {
         resolve(data);
      })
   });
   let decodedData = JSON.parse(body);
   // console.log(decodedData);

   // if (!decodedData.hasOwnProperty('default_delivery_address') || !decodedData.hasOwnProperty('phone_num') || !decodedData.hasOwnProperty('email') || !decodedData.hasOwnProperty('default_credit_card')){
   //    // console.log(decodedData.hasOwnProperty('default_delivery_address') + " " + decodedData.hasOwnProperty('phone_num') + " " + decodedData.hasOwnProperty('email') + " " + decodedData.hasOwnProperty('default_credit_card'));
   //    res.writeHead(400, {'Content-type': 'text/plain'});
   //    res.end('All properties are required');
   //    return;
   // }

   // only updates columns in table that user entered in
   try {
      let updateQuery = `UPDATE customer_account SET `;
      let updates = [];

      for (const key in decodedData) {
         if (decodedData.hasOwnProperty(key) && decodedData[key].length > 0) {
            updates.push(`${key} = '${decodedData[key]}'`);
         }
      }
      if (updates.length == 0) {
         res.writeHead(400, {"Content-Type": "text/plain"});
         res.end("No data provided");
         return;
      }

      updateQuery += updates.join(', ');
      updateQuery += ` WHERE cid = ${jwtBody.id}`;

      let updateRes = await runQuery(customerPool, updateQuery);
      res.writeHead(200, {"Content-Type": "text/plain"});
      res.end("Successfully updated");
      // let updateRes = await runQuery(customerPool, `UPDATE customer_account SET default_delivery_address = '${decodedData.default_delivery_address}', phone_num = '${decodedData.phone_num}', email = '${decodedData.email}', default_credit_card = '${decodedData.default_credit_card}' WHERE cid = ${jwtBody.cid}`);
      // res.writeHead(200, {'Content-Type': 'text/plain'});
      // res.end('Successfully updated');
   }
   catch (error) {
      console.log(error);
      res.writeHead(500, {'Content-Type': 'text/plain'})
      res.end('Internal server error');
      return;
   }
}
async function getCustomerAccounts(req, res) {
   let customerAccounts = await runQuery(customerPool, "SELECT * FROM customer_account");
   res.writeHead(200, {"Content-Type": "application/json"});
   res.write(JSON.stringify(customerAccounts));
   res.end();
}

async function getCustomerAccountById(req, res) {
   let url = req.url;
   let i = url.indexOf('/customerAccounts/');
   let cid = url.slice(i + 18);
   console.log(cid);
   let query = `SELECT * FROM customer_account WHERE cid = '${cid}'`;
   let customerAccount = await runQuery(customerPool, query);
   res.writeHead(200, {"Content-Type": "application/json"});
   res.write(JSON.stringify(customerAccount));
   res.end();
}

async function deleteAccount(req, res, jwtBody){
   
   try{
      let deleteQuery = await runQuery(customerPool, `DELETE FROM customer_account WHERE cid = ${jwtBody.id}`);
      res.writeHead(200, {"Content-Type": "text/plain"});
      res.end("Account successfully deleted");
   }
   catch(error){
      console.log(error);
      res.writeHead(500, {"Content-Type": "text/plain"});
      res.end("Internal error");
   }
}


module.exports = {
   routes: [
      {
         method: 'GET',
         path: '/customerAccounts',
         handler: getCustomerAccounts
      },
      {
         method: 'GET',
         path: /^\/customerAccounts\/[\d]+$/,
         handler: getCustomerAccountById
      },
      {
         method: 'POST',
         path: '/customer/accountInfo',
         handler: handleAuth(authRoles.customer, customerInfo)
      },
      {
         method: 'DELETE',
         path: '/deleteAccount',
         handler: handleAuth(authRoles.customer, deleteAccount)
      }
   ]
};
