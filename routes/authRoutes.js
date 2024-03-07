const {customerRegister, customerLogin, logout, loggedInTest} = require('../lib/authApi');

module.exports = [
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
      handler: loggedInTest
   }
];
