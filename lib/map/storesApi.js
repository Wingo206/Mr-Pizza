const {runQuery, visitorPool, adminPool} = require("../util/database_util");
const {handleAuth, authRoles} = require("../authApi.js");

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
   const contentType = req.headers['content-type']
   if (contentType != 'application/json') {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end("Content-type is not application/json");
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

   if (!decodedData.hasOwnProperty('address') || !decodedData.hasOwnProperty('latitude') || !decodedData.hasOwnProperty('longitude')) {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end('Missing a required property: address, latitude, longitude');
   }

   // query to add store to the database
   let queryRes = await runQuery(adminPool, 
      `insert into store(address, latlng) values ("${decodedData.address}", point(${decodedData.latitude}, ${decodedData.longitude}))`);
   
   res.writeHead(200, {'Content-type': 'text/plain'});
   res.write('Successfully added store');
   
}

async function editStore(req, res, jwtBody) {
   let nums = req.url.match(/\d+/g);
   let storeId = nums[0];

   const contentType = req.headers['content-type'];
   if (contentType != 'application/json') {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end("Content-type is not application/json");
   }

   let body = await new Promise(resolve => {
      let data = '';
      req.on('data', chuck => {
         data += chuck;
      })
      req.on('end', () => {
         resolve(data);
      })
   });

   let decodedData = JSON.parse(body);

   if (!decodedData.hasOwnProperty('address') || !decodedData.hasOwnProperty('latitude') || !decodedData.hasOwnProperty('longitude')) {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end('Missing a required property: address, latitude, longitude');
   }

   let queryRes = await runQuery(adminPool,
      `UPDATE store SET address = "${decodedData.address}", latlng = point(${decodedData.latitude}, ${decodedData.longitude}) WHERE store_id = ${storeId}`);
   console.log(queryRes)

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
