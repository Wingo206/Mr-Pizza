const http = require('http');
const fs = require('node:fs');
const path = require('path');
const querystring = require('querystring');

// setup router by using all files from the "routes/" directory
let routesDir = __dirname + '/routes';
let routeFiles = fs.readdirSync(routesDir).map(file => path.join(routesDir, file));

let staticRoutes = {};
let dynamicRoutes = [];
for (let i = 0; i < routeFiles.length; i++) {
   let routeFile = routeFiles[i];
   let currentHandlers = require(routeFile);

   // check for proper export
   if (!Array.isArray(currentHandlers)) {
      console.warn('File did not export list: ' + routeFile);
      continue;
   }

   // add each route handler to the global map
   let requriedProperties = ['method', 'path', 'handler'];
   for (let handler of currentHandlers) {
      // check if the handler has the required properties
      let valid = true;
      requriedProperties.forEach(p => {
         if (!handler.hasOwnProperty(p)) {
            console.warn(routeFile + ": missing " + p);
            valid = false;
         }
      })
      if (!valid) {
         continue;
      }

      // add the route to the map/list
      let handlerPath = handler.path
      if (handlerPath instanceof RegExp) {
         dynamicRoutes.dynamic.push(handler);
      } else if (typeof handlerPath === 'string') {
         staticRoutes[handlerPath] = handler;
      }
   }
}

console.log();
console.log("Loaded " + (Object.keys(staticRoutes).length + dynamicRoutes.length) + " routes from " + routeFiles.length + " files.")

async function handleRequest(req, res) {
   let url = req.url;
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
      res.writeHead(404, {'Content-type': 'text/plain'});
      res.end('Resource not found for route ' + url + '.')
      return;
   }

   // check method matches the route
   let method = req.method;
   if (method != route.method) {
      res.writeHead(415, {'Content-type': 'text/plain'});
      res.end('Method ' + route.method + " required for route " + url + '.')
      return;
   }
   
   // run the req validator
   // TODO

   // run the route's handler 
   return route.handler(req, res);
}

// console.log(__dirname)
// let reg = /^\/delivery\/[\d]{1,6}\/[/]?$/
// console.log(typeof(reg))
// console.log(reg instanceof RegExp)
// let inputStr = "/delivery/123/"
// console.log(inputStr.match(reg));
// if (inputStr.match(reg)) {
//    console.log("matched")
// } else {
//    console.log("didn't match")
// }

const server = http.createServer(handleRequest)

if (require.main === module) {
   server.listen(8080);
}

module.exports = {server}

