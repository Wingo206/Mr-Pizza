// example: /test
async function handleTestApi(req, res) {
   res.writeHead(200, {'Content-type': 'text/plain'});
   res.write('test response')
   res.end();
}

// example: /test/123
async function handleTestApiWithInput(req, res) {
   let url = req.url;
   let i = url.indexOf('/test/');
   let num = url.slice(i + 6);
   res.writeHead(200, {'Content-type': 'text/plain'});
   res.write('test response with input: ' + num)
   res.end();
}

module.exports = {handleTestApi, handleTestApiWithInput}
