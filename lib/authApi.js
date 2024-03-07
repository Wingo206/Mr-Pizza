const {runQuery, authPool} = require('./util/database_util');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const {jwtSecretKey} = require('./util/config')

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
      let insertRes = await runQuery(authPool, `insert into customer_account(username, password_hash) values ("${decodedData.username}", "${decodedData.password}")`)
      res.writeHead(201, {'Content-type': 'text/plain'})
      res.end('Successfully registered.');
   } catch (e) {
      console.log(e);
      res.writeHead(500, {'Content-type': 'text/plain'})
      res.end('Internal server error');
      return;
   }
}

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
      `select cid from customer_account c where c.username = "${decodedData.username}" and c.password_hash = "${decodedData.password}"`);
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
   return jwt.sign({authLevel: 'customer', cid: cid}, jwtSecretKey);
}

function checkAuthentication(token) {
   try {
      return jwt.verify(token, jwtSecretKey);
   } catch (e) {
      console.log(e);
      return undefined;
   }
}

function loggedInTest(req, res) {
   var cookies = cookie.parse(req.headers.cookie || '');

   if (!cookies.hasOwnProperty('authToken')) {
      res.writeHead(401, {'Content-type': 'text/plain'})
      res.end('You are not signed in.');
      return;
   }

   let token = cookies.authToken;
   let result = checkAuthentication(token);
   if (result === undefined) {
      res.writeHead(401, {'Content-type': 'text/plain'})
      res.end('You are not signed in.');
      return;
   }

   res.writeHead(200, {'Content-type': 'text/plain'})
   res.end('You are signed in as ' + result.authLevel + ', cid ' + result.cid + '.');



}

module.exports = {customerRegister, customerLogin, logout, loggedInTest}
