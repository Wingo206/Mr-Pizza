const handleTestApi = require('../lib/testApi')

module.exports = [
   {
      method: "GET",
      path: "/test",
      handler: handleTestApi
   }
];
