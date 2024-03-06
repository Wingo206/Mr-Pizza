// example: /example
async function handleExampleApi(req, res) {
   res.writeHead(200, {'Content-type': 'text/plain'});
   res.write('example response')
   res.end();
}

// example: /example/123
async function handleExampleApiWithInput(req, res) {
   let url = req.url;
   let i = url.indexOf('/example/');
   let num = url.slice(i + 9);
   res.writeHead(200, {'Content-type': 'text/plain'});
   res.write('example response with input: ' + num)
   res.end();
}

module.exports = {handleExampleApi, handleExampleApiWithInput}
