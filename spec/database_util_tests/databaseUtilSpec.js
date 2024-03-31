const {runQuery, adminPool, resetDatabase, dateToDb} = require("../../lib/util/database_util")
const {addValues} = require("../../lib/map/addTestValues")

describe('Database util', () => {
   it('should resest the entire database', async () => {
      await resetDatabase();

      // add a bunch of test values, with foreign keys
      await runQuery(adminPool, `insert into customer_account(username) values ("bob")`);
      await runQuery(adminPool, `INSERT INTO store(address, latlng) values
      ("busch student center", point(40.523421858838276, -74.45823918823967))`);
      await runQuery(adminPool, `insert into customer_order(status, delivery_latlng, DT_created, ordered_by, made_at) values
      ("in transit", POINT(40.41829236146375, -74.70639548636213), "${dateToDb(new Date())}", 1, 1)`);

      // check that the stuff has been added
      let res = await runQuery(adminPool, `select * from customer_account where username = "bob"`)
      expect(res.length).toEqual(1);
      
      // check that the stuff got reset
      await resetDatabase();
      res = await runQuery(adminPool, `select * from customer_account where username = "bob"`)
      expect(res.length).toEqual(0);
   })
})

