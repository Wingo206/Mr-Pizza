const {handleExampleApi, handleExampleApiWithInput} = require('../lib/exampleApi')

module.exports = [
   {
      method: 'GET',
      path: '/example',
      handler: handleExampleApi
   },
   {
      method: 'POST',
      path: /^\/example\/[\d]+$/, // starts (^), then "/test/", then 1+ digits ([\d]+), then ends ($)
      handler: handleExampleApiWithInput
   }
];
