/*
 * Routes public files, such as html files, scripts, the webpage icon,
 * images, etc.
 */
const fs = require('node:fs');
const path = require('path');
const {authRoles, handleAuth} = require('./authApi');

let splitPath = __dirname.split(path.sep)
splitPath.pop();
splitPath.push('public');
const publicDir = splitPath.join(path.sep);

const authRequirements = {
   '/html/authProtectedExample.html': authRoles.customer, 
   '/order/pastOrder.html': authRoles.employee,
}

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

      // if on windows, replace the \\ with /
      let routePath = path.sep + path.join(currentPath, filename);
      routePath = routePath.split(path.sep).join('/');
      // create handler. Check if authroization is needed.
      let handler = (req, res) => {
         let stream = fs.createReadStream(filepath);
         // set the content type
         let contentType = 'text/plain';
         if (filepath.includes('.html')) {
            contentType = 'text/html';
         } else if (filepath.includes('.js')) {
            contentType = 'text/javascript';
         }
         stream.on('error', () => {
            res.writeHead(404, {'Content-type': 'text/plain'});
            res.end('Error loading resource ' + req.url + '.')
         })
         res.setHeader("Content-Type", contentType);
         stream.pipe(res);
      }

      if (authRequirements.hasOwnProperty(routePath)) {
         handler = handleAuth(authRequirements[routePath], handler);
      }

      // add a route for the file
      routes.push({
         method: 'GET',
         path: routePath,
         handler: handler,
      });
   }
   return routes;
}

module.exports = {
   routes: routeDirectory('')
}