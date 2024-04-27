const bcrypt = require('bcrypt');
const saltRounds = 10;
const someOtherPlaintextPassword = 'brogman';
const crypto = require('crypto');

async function test() {
   let hash = await new Promise(resolve => {
      bcrypt.hash('bruhman', saltRounds, (err, hash) => {
         resolve(hash);
      });
   })
   console.log(hash);
   let comparison = await new Promise(resolve => {
      bcrypt.compare('bruhman', hash, (err, result) => {
         resolve(result);
      })
   })
   console.log(comparison);
   let comparison2 = await new Promise(resolve => {
      bcrypt.compare('brogman', hash, (err, result) => {
         resolve(result);
      })
   })
   console.log(comparison2);

   crypto.randomBytes(8, (err, buf) => {
      console.log(buf.toString('hex'));
   });
}

if (require.main === module) {
   test();
}
