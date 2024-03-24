const {handleAuth, authRoles} = require("../authApi");
const {employeePool, runQuery} = require("../util/database_util");

async function assignDeliveryBatches(req, res, jwtBody) {
   console.log(jwtBody);
   // check if the employee that is signed in works at the specified store
   let nums = req.url.match(/\d+/g);
   let storeId = nums[0];
   let empStoreIdRes = await runQuery(employeePool, `select works_at from employee_account where eid = ${jwtBody.id}`)
   let worksAt = empStoreIdRes[0].works_at;
   if (worksAt != storeId) {
      res.writeHead(403, {'Content-type': 'text/plain'});
      res.end(`Employee does not work at the store with id ${storeId}.`);
   }

   res.writeHead(200, {'Content-type': 'text/plain'});
   res.end('hello');
}

module.exports = {
   routes: [
      {
         method: 'GET', // TODO change to post
         path: /^\/assignBatches\/[\d]+$/, // url: store id to assign from
         handler: handleAuth(authRoles.employee, assignDeliveryBatches)
      },
   ]
}
