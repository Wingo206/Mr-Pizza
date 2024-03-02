const {handleTestApi, handleTestApiWithInput} = require('../lib/testApi')

module.exports = [
   {
      method: "GET",
      path: "/test",
      handler: handleTestApi
   },
   {
      method: "POST",
      path: /^\/test\/[\d]+$/, // starts (^), then "/test/", then 1+ digits ([\d]+), then ends ($)
      handler: handleTestApiWithInput
   }
];
