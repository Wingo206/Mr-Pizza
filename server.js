const https = require('https');
const http = require('http');
const fs = require('node:fs');
const path = require('path');

// setup router by using all files from the "lib/" directory
let dir = path.join(__dirname, 'lib');
let files = fs.readdirSync(dir).map(f => path.join(dir, f));

let staticRoutes = {};
let dynamicRoutes = [];
console.log('Loading routes')
for (let i = 0; i < files.length; i++) {
   let file = files[i];
   // if file is a directory, then add to the queue.
   if (fs.lstatSync(file).isDirectory()) {
      files = files.concat(fs.readdirSync(file).map(f => path.join(file, f)));
      continue;
   }
   let fileExports = require(file);

   // check for routes export
   if (fileExports === undefined || !fileExports.hasOwnProperty('routes')) {
      continue; // file does not export any routes
   }
   let currentRoutes = fileExports.routes;
   if (!Array.isArray(currentRoutes)) {
      console.warn('Exported routes is list: ' + file);
      continue;
   }

   // add each route handler to the global map
   let requriedProperties = ['method', 'path', 'handler'];
   for (let route of currentRoutes) {
      // check if the handler has the required properties
      let valid = true;
      requriedProperties.forEach(p => {
         if (!route.hasOwnProperty(p)) {
            console.warn(file + ": missing " + p);
            valid = false;
         }
      })
      if (!valid) {
         continue;
      }

      // add the route to the map/list
      let routePath = route.path
      if (routePath instanceof RegExp) {
         dynamicRoutes.push(route);
         console.log(routePath);
      } else if (typeof routePath === 'string') {
         if (staticRoutes.hasOwnProperty(routePath)) {
            console.warn('Duplicate route ' + routePath + ' in file ' + file);
            continue;
         }
         staticRoutes[routePath] = route;
         console.log(routePath);
      }
   }
}

console.log("Loaded " + (Object.keys(staticRoutes).length + dynamicRoutes.length) + " routes from " + files.length + " files.")

async function handleRequest(req, res) {
   let url = req.url;
   console.log(url);
   // check if matches any static or dynamic routes
   let route = staticRoutes[url];
   if (route === undefined) {
      for (let dh of dynamicRoutes) {
         if (dh.path.test(url)) {
            route = dh;
         }
      }
   }
   if (route === undefined) {
      console.warn('404 on route ' + url)
      res.writeHead(404, {'Content-type': 'text/plain'});
      res.end('Resource not found for route ' + url + '.')
      return;
   }

   // check method matches the route
   let method = req.method;
   if (method != route.method) {
      console.warn('405 on route ' + url);
      res.writeHead(405, {'Content-type': 'text/plain'});
      res.end('Method ' + route.method + " required for route " + url + '.')
      return;
   }

   // run the route's handler 
   await route.handler(req, res);
}


let sslPath = path.join(__dirname, 'ssl')
const options = {
   key: fs.readFileSync(path.join(sslPath, 'server.key')),
   cert: fs.readFileSync(path.join(sslPath, 'server.crt'))
}

const server = https.createServer(options, handleRequest)

if (require.main === module) {
   console.log('Listening on port 8080');
   server.listen(8080);
   // httpServer.listen(8090);
}

module.exports = server; 

