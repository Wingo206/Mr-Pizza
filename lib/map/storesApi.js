const {runQuery, visitorPool} = require("../util/database_util");

async function getStores(req, res) {
   let stores = await runQuery(visitorPool, 'SELECT * FROM store');
   res.writeHead(200, {'Content-type': 'applicaton/json'});
   res.write(JSON.stringify(stores));
   res.end();

}

module.exports = {
   routes: [
      {
         method: 'GET',
         path: '/stores',
         handler: getStores
      },
   ]
};
