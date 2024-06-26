const {runQuery, authPool, customerPool, employeePool} = require('./util/database_util');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const {jwtSecretKey} = require('./util/config');
const {getJSONBody} = require('./util/inputValidationUtil');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const saltRounds = 10;

const authRoles = {
   customer: 'customer',
   employee: 'employee',
   admin: 'admin'
};
Object.freeze(authRoles);



/**
 * Api endpoint. 
 * Takes in json body of username and password.
 * responds with confirmation or error.
 */
async function handleCustomerRegister(req, res) {
   let decodedData = await getJSONBody(req, res, ['username', 'password']);
   if (!decodedData) {
      return;
   }

   // check if username is used already
   let queryRes = await runQuery(authPool,
      `select username from customer_account c where c.username = "${decodedData.username}"`);
   console.log(queryRes)
   if (queryRes.length > 0) {
      res.writeHead(409, {'Content-type': 'text/plain'})
      res.end('User with username ' + decodedData.username + ' is already registered.');
      return;
   }

   // add the user to the database
   try {
      await registerAccount(authRoles.customer, decodedData.username, decodedData.password);
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
 * Helper function to register a customer into the database
 * with a username and password.
 * Adds random salt and hashes the password using bcrypt
 * userEmail: username or email
 */
async function registerAccount(authRole, userEmail, password) {
   // generate the bcrypt hash
   let hash = await new Promise(resolve => {
      bcrypt.hash(password, saltRounds, (err, hash) => {
         resolve(hash);
      });
   })

   let res;
   if (authRole == authRoles.customer) {
      res = await runQuery(authPool, `insert into
      customer_account(username, password_hash) values
      ("${userEmail}", "${hash}")`)
   } else if (authRole == authRoles.employee) {
      res = await runQuery(authPool, `insert into
      employee_account(email, password_hash) values
      ("${userEmail}", "${hash}")`)
   } else if (authRole == authRoles.admin) {
      res = await runQuery(authPool, `insert into
      admin_account(email, password_hash) values
      ("${userEmail}", "${hash}")`)
   } else {
      throw new Error('Invalid auth role');
   }
   console.log(res);
}

/**
 * Api endpoint. 
 * Takes in json body of username/email and password.
 * responds with set-cookie header containing appropriate level JWT.
 */
function handleLogin(authRole) {
   return async (req, res) => {
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

      let decodedData;
      try {
         decodedData = JSON.parse(body);
      } catch (e) {
         res.writeHead(400, {'Content-Type': 'application/json'});
         res.end(JSON.stringify({error: "Could not parse JSON body"}));
         return;
      }

      // make sure the request has email/username and password
      if (!decodedData.hasOwnProperty('email') && !decodedData.hasOwnProperty('username')) {
         res.writeHead(400, {'Content-type': 'text/plain'})
         res.end('Email or Username properties required.');
         return;
      }
      if (!decodedData.hasOwnProperty('password')) {
         res.writeHead(400, {'Content-type': 'text/plain'})
         res.end('Password property required.');
         return;
      }


      // fetch the hashed password from the database
      let query;
      if (authRole == authRoles.customer) {
         query = `select cid as id, password_hash from customer_account c where c.username = "${decodedData.username}"`;
      } else if (authRole == authRoles.employee) {
         query = `select eid as id, password_hash from employee_account e where e.email = "${decodedData.email}"`;
      } else if (authRole == authRoles.admin) {
         query = `select aid as id, password_hash from admin_account a where a.email = "${decodedData.email}"`;
      } else {
         throw new Error("Invalid auth role.")
      }
      let queryRes = await runQuery(authPool, query);
      console.log(queryRes)

      // if account doesn't exist
      if (queryRes.length == 0) {
         res.writeHead(401, {'Content-type': 'text/plain'})
         res.end('Incorrect username or password.');
         return;
      }
      let password_hash = queryRes[0].password_hash;

      // check if the hash matches
      let comparison = await new Promise(resolve => {
         bcrypt.compare(decodedData.password, password_hash, (err, result) => {
            resolve(result);
         })
      })
      if (!comparison) {
         res.writeHead(401, {'Content-type': 'text/plain'})
         res.end('Incorrect username or password.');
         return;
      }

      let id = queryRes[0].id;
      let cookieContents = cookie.serialize('authToken', getJWT(authRole, id), {
         path: '/',
         overwrite: true,
         httpOnly: true,
         secure: true,
         maxAge: 60 * 60 * 24 * 1 // 1 day
      })
      console.log('cookie: ' + cookieContents);

      res.writeHead(200, {
         'Content-type': 'text/plain',
         'Set-Cookie': cookieContents,
      })
      res.end('Successful Login, setting cookie');

   }
}

/**
 * Api endpoint. 
 * responds with set-cookie header removing the authToken.
 */
async function logout(req, res) {
   console.log('logout')
   let cookieContents = cookie.serialize('authToken', '', {
      path: '/',
      overwrite: true,
      httpOnly: true,
      secure: true,
      maxAge: 1
   });

   console.log(cookieContents)
   res.writeHead(200, {
      'Content-type': 'text/plain',
      'Set-Cookie': cookieContents
   })
   res.end('Successful Logout, setting cookie');
}

function getJWT(authRole, id) {
   return jwt.sign({authRole: authRole, id: id}, jwtSecretKey);
}

/**
 * Wraps a request handler with a check for authorization of a specified role.
 * @param requiredRole - role allowed to access the route. 
 * @param nextHandler {function(req, res, jwtBody) : None} next handler to run
 * if authorization passes. jwtBody is passed into the next handler.
 */
function handleAuth(requiredRole, nextHandler) {
   return async function (req, res) {
      let jwtBody;
      let cookies = cookie.parse(req.headers.cookie || '');

      // Check if the authToken cookie is there.
      if (!cookies.hasOwnProperty('authToken')) {
         res.writeHead(401, {'Content-type': 'text/plain'})
         res.end('You are not signed in.');
         return;
      }

      // Check if the authToken is a valid JWT, signed with the secret key.
      let token = cookies.authToken;
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
   let info = await runQuery(customerPool, `select * from customer_account where cid = "${jwtBody.id}"`)

   res.writeHead(200, {'Content-type': 'text/plain'})
   res.end(`You are signed in as ${jwtBody.authRole} , cid ${jwtBody.cid} .\n` +
      `your info is: ${JSON.stringify(info)}`);
}

/**
 * Api endpoint. 
 * responds with JSON containing nothing, or authRole.
 */
async function getAuthRole(req, res) {
   let jwtBody = {authRole: 'none'};
   let cookies = cookie.parse(req.headers.cookie || '');

   // Check if the authToken cookie is there.
   if (cookies.hasOwnProperty('authToken')) {
      // Get jwt body
      let token = cookies.authToken;
      try {
         jwtBody = jwt.verify(token, jwtSecretKey);
      } catch (e) {
         // empty JSON
         res.writeHead(200, {'Content-type': 'application/json'});
         res.end(JSON.stringify(jwtBody));
         return;
      }
   }
   // write the response
   res.writeHead(200, {'Content-type': 'application/json'});
   res.end(JSON.stringify(jwtBody));
   return;
}

/**
 * Takes the store id from the url and ensures that the user is an
 * employee that works at this store.
 */
function handleWorksAt(nextHandler) {
   return handleAuth(authRoles.employee, async (req, res, jwtBody) => {
      // check if the employee that is signed in works at the specified store
      let nums = req.url.match(/\d+/g);
      let storeId = nums[0];
      let empStoreIdRes = await runQuery(employeePool, `select works_at from employee_account where eid = ${jwtBody.id}`)
      if (empStoreIdRes.length == 0) {
         res.writeHead(400, {'Content-type': 'text/plain'});
         res.end(`Invalid employee.`);
         return;
      }
      let worksAt = empStoreIdRes[0].works_at;
      if (worksAt != storeId) {
         res.writeHead(401, {'Content-type': 'text/plain'});
         res.end(`Employee does not work at the store with id ${storeId}.`);
         return;
      }

      // run the next handler
      await nextHandler(req, res, jwtBody, storeId);
   })
}

/**
 * API endpoint.
 * returns info about the employee that is logged in
 * includes info about the store they work at
 */
async function getEmployeeStoreInfo(req, res, jwtBody) {
   let queryRes = await runQuery(employeePool,
      `select *
      from employee_account e 
      join store s on e.works_at = s.store_id
      where e.eid = ${jwtBody.id}`)
   if (queryRes.length == 0) {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end(`Invalid employee.`);
      return;
   }
   res.writeHead(200, {'Content-type': 'application/json'});
   res.end(JSON.stringify(queryRes[0]));
}


async function getCustomerInfo(req, res, jwtBody) {
   let query = `SELECT * FROM customer_account WHERE cid = ${jwtBody.id}`;
   let getCustomerInfo = await runQuery(customerPool, query);
   // console.log(getCustomerInfo);
   res.writeHead(200, {"Content-Type": "text/plain"});
   // return getCustomerInfo;
   // res.writeHead(200, {"Content-Type": 'application/json'});
   res.end(JSON.stringify(getCustomerInfo[0]));
}


async function getEmployeeInfo(req, res, jwtBody){
   let query = `SELECT * FROM employee_account where eid = ${jwtBody.id}`;
   let getEmployeeInfo = await runQuery(employeePool, query);
   res.writeHead(200, {"Content-Type" : "text/plain"});
   res.end(JSON.stringify(getEmployeeInfo[0]));
}




module.exports = {
   authRoles,
   handleAuth,
   handleWorksAt,
   registerAccount,
   routes: [
      {
         method: 'POST',
         path: '/customer/register',
         handler: handleCustomerRegister
      },
      {
         method: 'POST',
         path: '/customer/login',
         handler: handleLogin(authRoles.customer)
      },
      {
         method: 'POST',
         path: '/employee/login',
         handler: handleLogin(authRoles.employee)
      },
      {
         method: 'POST',
         path: '/admin/login',
         handler: handleLogin(authRoles.admin)
      },
      {
         method: 'GET',
         path: '/authRole',
         handler: getAuthRole
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
         method: 'GET',
         path: '/employeeStoreInfo',
         handler: handleAuth(authRoles.employee, getEmployeeStoreInfo)
      },
      {
         method: 'GET',
         path: '/getCustomerInfo',
         handler: handleAuth(authRoles.customer, getCustomerInfo)
      },
      {
         method: 'GET',
         path: '/getEmployeeInfo',
         handler: handleAuth(authRoles.employee, getEmployeeInfo)
      }
   ]
};

