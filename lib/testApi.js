async function handleTestApi(req, res) {
   res.writeHead(200, {'Content-type': 'text/plain'});
   res.write('test response')
   res.end();
}

module.exports = handleTestApi
