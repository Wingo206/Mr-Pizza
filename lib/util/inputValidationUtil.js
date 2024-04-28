

/**
 * Helper function to validate JSON body in request.
 * input: req, res, requiredFields(array of strings)
 */
async function getJSONBody(req, res, requiredFields) {
   // check content type is json
   const contentType = req.headers['content-type']
   if (contentType != 'application/json') {
      res.writeHead(415, {'Content-type': 'text/plain'})
      res.end('json body required.');
      return;
   }
   // read the body
   let body = await new Promise(resolve => {
      let data = '';
      req.on('data', chunk => {
         data += chunk;
      })
      req.on('end', () => {
         resolve(data);
      })
   });
   let parsedBody;
   try {
      parsedBody = JSON.parse(body);
   } catch (e) {
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: "Could not parse JSON body"}));
      return;
   }

   // check if all the required fields are there
   let missing = [];
   for (let i = 0; i < requiredFields.length; i++) {
      let curField = requiredFields[i];
      if (!parsedBody.hasOwnProperty(curField)) {
         missing.push(curField);
      }
   }

   // return bad request if there are missing required properties
   if (missing.length > 0) {
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
         error: "Missing required properties",
         missingProperties: missing
      }));
      return;
   }

   return parsedBody;
}

module.exports = {
   getJSONBody
}
