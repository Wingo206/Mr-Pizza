const fs = require('node:fs');
const path = require('path');

// create routes for each file in views
let viewRoutes = [];

let splitPath = __dirname.split(path.sep)
splitPath.pop();
let viewsDir = path.join(splitPath.join(path.sep), 'views')

let viewFiles = fs.readdirSync(viewsDir)//.map(file => path.join(routesDir, file));
for (let i = 0; i < viewFiles.length; i++) {
   let filename = viewFiles[i];
   let filepath = path.join(viewsDir, filename);

   viewRoutes.push({
      method: 'GET',
      path: '/views/' + filename,
      handler: (req, res) => {
         let stream = fs.createReadStream(filepath);
         stream.on('error', () => {
            res.writeHead(404, {'Content-type': 'text/plain'});
            res.end('Error loading resource ' + req.url + '.')
         })
         stream.pipe(res);
      }
   });
}

module.exports = viewRoutes;
