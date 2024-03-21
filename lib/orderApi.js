// example: /example
async function handleOrderApi(req, res) {
   res.writeHead(200, {'Content-type': 'text/plain'});
   res.write('example response')
   res.end();
}

// example: /example/123
async function handleOrderApiWithInput(req, res) {
   let url = req.url;
   let i = url.indexOf('/order/');
   let num = url.slice(i + 9);
   res.writeHead(200, {'Content-type': 'text/plain'});
   res.write('example response with input: ' + num)
   res.end();
}

module.exports = {
   routes: [
      {
         method: 'GET',
         path: '/order',
         handler: handleOrderApi
      },
      {
         method: 'POST',
         path: /^\/order\/[\d]+$/, // starts (^), then "/test/", then 1+ digits ([\d]+), then ends ($)
         handler: handleOrderApiWithInput
      }
   ]
};
