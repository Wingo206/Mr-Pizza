const {runQuery, visitorPool} = require("../util/database_util");

async function getStores(req, res) {
   let stores = await runQuery(visitorPool, 'SELECT store_id, latitude, longitude FROM store');
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
   ]
};
