const {runQuery, authPool, customerPool} = require('./util/database_util');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const {jwtSecretKey} = require('./util/config')

const authRoles = {
   customer: 'customer',
};
Object.freeze(authRoles);

/**
 * Api endpoint. 
 * Takes in json body of username and password.
 * responds with confirmation or error.
 */
async function customerRegister(req, res) {
   const contentType = req.headers['content-type']
   if (contentType != 'application/json') {
      res.writeHead(415, {'Content-type': 'text/plain'})
      res.end('json body required.');
      return;
   }
   // get the body
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

   // make sure the request has username and password
   if (!decodedData.hasOwnProperty('username') || !decodedData.hasOwnProperty('password')) {
      res.writeHead(400, {'Content-type': 'text/plain'})
      res.end('Username and password properties required.');
      return;
   }

   // check if username is used already
   let queryRes = await runQuery(authPool,
      `select username from customer_account c where c.username = "${decodedData.username}"`);
   if (queryRes.length > 0) {
      res.writeHead(409, {'Content-type': 'text/plain'})
      res.end('User with username ' + decodedData.username + ' is already registered.');
      return;
   }

   // add the user to the database
   try {
      let insertRes = await runQuery(authPool, `insert into
      customer_account(username, password_hash) values
      ("${decodedData.username}", "${decodedData.password}")`)
      res.writeHead(201, {'Content-type': 'text/plain'})
      res.end('Successfully registered.');
   } catch (e) {
      console.log(e);
      res.writeHead(500, {'Content-type': 'text/plain'})
      res.end('Internal server error');
      return;
   }
}

/**
 * Api endpoint. 
 * Takes in json body of username and password.
 * responds with set-cookie header containing customer-level JWT.
 */
async function customerLogin(req, res) {
   const contentType = req.headers['content-type']
   if (contentType != 'application/json') {
      res.writeHead(415, {'Content-type': 'text/plain'})
      res.end('json body required.');
      return;
   }
   // get the body
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

   // make sure the request has username and password
   if (!decodedData.hasOwnProperty('username') || !decodedData.hasOwnProperty('password')) {
      res.writeHead(400, {'Content-type': 'text/plain'})
      res.end('Username and password properties required.');
      return;
   }

   // check if the password matches
   let queryRes = await runQuery(authPool,
      `select cid from customer_account c where c.username = "${decodedData.username}"
   and c.password_hash = "${decodedData.password}"`);
   console.log(queryRes)
   if (queryRes.length == 0) {
      res.writeHead(401, {'Content-type': 'text/plain'})
      res.end('Incorrect username or password.');
      return;
   }

   let cid = queryRes[0].cid;

   res.writeHead(200, {
      'Content-type': 'text/plain',
      'Set-Cookie': cookie.serialize('authToken', getCustomerJWT(cid), {
         path: '/',
         overwrite: true,
         httpOnly: true,
         secure: true,
         maxAge: 60 * 60 * 24 * 1 // 1 day
      }),
   })
   res.end('setting cookie');
}

/**
 * Api endpoint. 
 * responds with set-cookie header removing the authToken.
 */
async function logout(req, res) {
   console.log('logout')
   res.writeHead(200, {
      'Content-type': 'text/plain',
      'Set-Cookie': cookie.serialize('authToken', '', {
         path: '/',
         overwrite: true,
         httpOnly: true,
         secure: true,
         maxAge: 1
      }),
   })
   res.end('setting cookie');
}

function getCustomerJWT(cid) {
   return jwt.sign({authRole: 'customer', cid: cid}, jwtSecretKey);
}

/**
 * Wraps a request handler with a check for authorization of a specified role.
 * @param requiredRole - role allowed to access the route.
 * @param nextHandler {function(req, res, jwtBody) : None} next handler to run
 * if authorization passes. jwtBody is passed into the next handler.
 */
function handleAuth(requiredRole, nextHandler) {
   return async function (req, res) {
      var cookies = cookie.parse(req.headers.cookie || '');

      // Check if the authToken cookie is there.
      if (!cookies.hasOwnProperty('authToken')) {
         res.writeHead(401, {'Content-type': 'text/plain'})
         res.end('You are not signed in.');
         return;
      }

      // Check if the authToken is a valid JWT, signed with the secret key.
      let token = cookies.authToken;
      let jwtBody;
      try {
         jwtBody = jwt.verify(token, jwtSecretKey);
      } catch (e) {
         console.log(e);
         res.writeHead(401, {'Content-type': 'text/plain'})
         res.end('You are not signed in.');
         return;
      }

      // Check if the role in the JWT is the correct role.
      let authRole = jwtBody.authRole;
      if (authRole != requiredRole) {
         console.log('Access denied. jwtBody: ' + JSON.stringify(jwtBody))
         res.writeHead(401, {'Content-type': 'text/plain'})
         res.end('Access Denied.');
         return;
      }

      // Authorization passed, run the next handler.
      await nextHandler(req, res, jwtBody);
   }
}

async function loggedInTest(req, res, jwtBody) {
   let info = await runQuery(customerPool, `select * from customer_account where cid = "${jwtBody.cid}"`)

   res.writeHead(200, {'Content-type': 'text/plain'})
   res.end(`You are signed in as ${jwtBody.authRole} , cid ${jwtBody.cid} .\n` +
      `your info is: ${JSON.stringify(info)}`);
}

async function customerInfo(req, res, jwtBody){
   const contentType = req.headers['content-type'];
   if (contentType != 'application/json'){
      res.writeHead(415, {'Content-Type': 'text/plain'});
      res.end('json body required');
      return;
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
   // console.log(decodedData);

   if (!decodedData.hasOwnProperty('default_delivery_address') || !decodedData.hasOwnProperty('phone_num') || !decodedData.hasOwnProperty('email') || !decodedData.hasOwnProperty('default_credit_card')){
      // console.log(decodedData.hasOwnProperty('default_delivery_address') + " " + decodedData.hasOwnProperty('phone_num') + " " + decodedData.hasOwnProperty('email') + " " + decodedData.hasOwnProperty('default_credit_card'));
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end('All properties are required');
      return;
   }

   try {
      let updateRes = await runQuery(customerPool, `UPDATE customer_account SET default_delivery_address = '${decodedData.default_delivery_address}', phone_num = '${decodedData.phone_num}', email = '${decodedData.email}', default_credit_card = '${decodedData.default_credit_card}' WHERE cid = ${jwtBody.cid}`);
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Successfully updated');
   }
   catch(error){
      console.log(error);
      res.writeHead(500, {'Content-Type': 'text/plain'})
      res.end('Internal server error');
      return;
   }
}




module.exports = {
   authRoles,
   handleAuth,
   routes: [
      {
         method: 'POST',
         path: '/customer/register',
         handler: customerRegister
      },
      {
         method: 'POST',
         path: '/customer/login',
         handler: customerLogin
      },
      {
         method: 'POST',
         path: '/logout',
         handler: logout
      },
      {
         method: 'GET',
         path: '/loggedInTest',
         handler: handleAuth(authRoles.customer, loggedInTest)
      },
      {
         method: 'POST',
         path: '/customer/accountInfo',
         handler: handleAuth(authRoles.customer, customerInfo)
      }
   ]
};

