const {runQuery, visitorPool, adminPool} = require("../util/database_util");
const {handleAuth, authRoles} = require("../authApi.js");
const {getJSONBody} = require("../util/inputValidationUtil");

async function getStores(req, res) {
   let stores = await runQuery(visitorPool, 'SELECT store_id, latlng FROM store');
   res.writeHead(200, {'Content-type': 'applicaton/json'});
   res.write(JSON.stringify(stores));
   res.end();
}

async function getDetailedInfo(req, res) {
   // get storeId from the url, don't need to verify because the route already verified
   let nums = req.url.match(/\d+/g);
   let storeId = nums[0];

   let storeInfo = await runQuery(visitorPool, `SELECT * FROM store s WHERE s.store_id = "${storeId}"`);
   if (storeInfo.length != 1) {
      res.writeHead(404, {'Content-type': 'text/plain'});
      res.end(`Store with storeId ${storeId} not found.`);
   }
   res.writeHead(200, {'Content-type': 'applicaton/json'});
   res.end(JSON.stringify(storeInfo[0]));
}

//TODO validate that the location in
async function addStore(req, res, jwtBody) {
   // read the fields from the body
   let decodedData = await getJSONBody(req, res, ['address', 'latitude', 'longitude'])
   if (!decodedData) {
      return;
   }

   // query to add store to the database
   let queryRes = await runQuery(adminPool,
      `insert into store(address, latlng) values ("${decodedData.address}", point(${decodedData.latitude}, ${decodedData.longitude}))`);

   res.writeHead(201, {'Content-type': 'text/plain'});
   res.end('Successfully added store');

}

async function editStore(req, res, jwtBody) {
   let nums = req.url.match(/\d+/g);
   let storeId = nums[0];

   let decodedData = await getJSONBody(req, res, ['address', 'latitude', 'longitude']);
   console.log(decodedData)
   if (!decodedData) {
      return;
   }

   let queryRes = await runQuery(adminPool,
      `UPDATE store SET address = "${decodedData.address}", latlng = point(${decodedData.latitude}, ${decodedData.longitude}) WHERE store_id = ${storeId}`);
   console.log(queryRes)
   if (queryRes.affectedRows == 0) {
      res.writeHead(404, {'Content-type': 'text/plain'});
      res.end('Store not found.');
   }

   res.writeHead(200, {'Content-type': 'text/plain'});
   res.end('Successfully edited store');
}

module.exports = {
   routes: [
      {
         method: 'GET',
         path: '/stores',
         handler: getStores
      },
      {
         method: 'GET',
         path: /^\/stores\/[\d]+$/,
         handler: getDetailedInfo
      },
      {
         method: 'POST',
         path: /^\/stores\/[\d]+\/edit$/,
         handler: handleAuth(authRoles.admin, editStore)
      },
      {
         method: 'POST',
         path: '/stores/add',
         handler: handleAuth(authRoles.admin, addStore)
      }
   ]
};
