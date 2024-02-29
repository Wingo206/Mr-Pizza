const {handleTestApi, handleTestApiWithInput} = require('../lib/testApi')

module.exports = [{
   method: "GET",
   path: "/test",
   handler: handleTestApi
}, {
   method: "POST",
   path: /^\/test\/[\d]+$/, // starts (^), then "/test/", then 0-6 digits ([\d]{1,6}), then ends ($)
   handler: handleTestApiWithInput
}];
