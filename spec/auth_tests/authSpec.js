const suppressOutput = require('../support/suppressOutput');
const request = require('supertest');
const jasmineCompat = require('../support/jasmineCompat');
const {resetDatabase, runQuery, adminPool} = require('../../lib/util/database_util');

let server;

describe('Auth Api', () => {
   // Comment this out if you need to view the log outputs.
   suppressOutput(() => {}, () => {
      server = require('../../server');
   });
   beforeEach(async () => {
      resetDatabase();
      await runQuery(adminPool,
         `insert into customer_account(username, password_hash) values
         ("customer", "test")`);
   })
   it('should respond with an authorization cookie', async () => {
      let res = await request(server)
         .post('/customer/login')
         .trustLocalhost(true)
         .set('Content-type', 'application/json')
         .send(JSON.stringify({
            username: "customer",
            password: "test"
         }))
         .expect('Content-type', 'text/plain')
         .expect(200)
         .expect('setting cookie')
      let cookie = res.headers['set-cookie'];
      expect(cookie).not.toEqual(undefined);
      // extract the actual value of the cookie later
   })
})
