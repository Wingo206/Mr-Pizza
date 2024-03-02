/*
 * Routes static files, such as html files, scripts, the webpage icon,
 * images, etc.
 */
const fs = require('node:fs');
const path = require('path');

let splitPath = __dirname.split(path.sep)
splitPath.pop();
splitPath.push('public');
// const mrPizzaDir = path.join(splitPath.join(path.sep))
const publicDir = splitPath.join(path.sep);

// create routes for each file in views
// input: current path of dir relative to mrpizza
// relative to "Mr-Pizza/" directory
function routeDirectory(currentPath) {
   let routes = [];

   let files = fs.readdirSync(path.join(publicDir, currentPath))
   for (let i = 0; i < files.length; i++) {
      let filename = files[i];
      let filepath = path.join(publicDir, currentPath, filename);

      // check for directory, if it is then recursively add those routes as well
      if (fs.lstatSync(filepath).isDirectory()) {
         routes = routes.concat(routeDirectory(path.join(currentPath, filename)))
         continue;
      }

      // add a route for the file
      routes.push({
         method: 'GET',
         path: path.sep + path.join(currentPath, filename),
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
   return routes;
}


module.exports = routeDirectory('')
