const {handleAuth, authRoles, handleWorksAt} = require("../authApi");
const {employeePool, runQuery} = require("../util/database_util");


async function assignDeliveryBatches(req, res, jwtBody) {
   // // check if the employee that is signed in works at the specified store
   // let nums = req.url.match(/\d+/g);
   // let storeId = nums[0];
   // let empStoreIdRes = await runQuery(employeePool, `select works_at from employee_account where eid = ${jwtBody.id}`)
   // let worksAt = empStoreIdRes[0].works_at;
   // if (worksAt != storeId) {
   //    res.writeHead(403, {'Content-type': 'text/plain'});
   //    res.end(`Employee does not work at the store with id ${storeId}.`);
   // }

   res.writeHead(200, {'Content-type': 'text/plain'});
   res.end('hello');
}

/**
 * api endpoint.
 * get JSON list of orders for a given store which are ready for delivery
 * but not yet assigned (status = "in transit" and in_batch = null)
 */
async function getUnassignedOrders(req, res, jwtBody) {
   
}

module.exports = {
   routes: [
      {
         method: 'GET', // TODO change to post
         path: /^\/assignBatches\/[\d]+$/, // url: store id to assign from
         handler: handleWorksAt(assignDeliveryBatches)
      },
      {
         method: 'GET',
         path: /^\/unassigned\/[\d]+$/, // url: store id to assign from
         handler: handleAuth(authRoles.employee, getUnassignedOrders)
      },
   ]
}
