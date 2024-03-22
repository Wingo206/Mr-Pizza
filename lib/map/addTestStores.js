const {adminPool, runQuery} = require("../util/database_util");

// Add in some example locations
async function addStores() {
   await runQuery(adminPool, 'DELETE FROM store');
   let queryRes = await runQuery(adminPool, 'INSERT INTO store(address, latitude, longitude) values' +
      '("busch student center", 40.523421858838276, -74.45823918823967),' +
      '("livingston student center", 40.52362753497832, -74.43692635431962)'
   )
   console.log(queryRes);
}


if (require.main === module) {
   addStores();
}
