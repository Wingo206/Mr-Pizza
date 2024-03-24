const {handleAuth, authRoles, handleWorksAt} = require("../authApi");
const {employeePool, runQuery} = require("../util/database_util");
const superagent = require('superagent');
const {googleMapsApiKey} = require("../util/config");
const path = require('path');
const fs = require('node:fs');


/**
 * api endpoint.
 * get JSON list of orders for a given store which are ready for delivery
 * but not yet assigned (status = "in transit" and not in in_batch)
 * gets the estimated delivery time for each order.
 */
async function getUnassignedOrders(req, res, jwtBody, storeId) {
   let unassignedOrders = await queryUnassignedOrders(storeId);
   let storeLatlng = await queryStoreLatlng(storeId);
   // get estimated driving times
   let routeMatrixInput = {
      "origins": [
         {
            "waypoint": {
               "location": {
                  "latLng": {
                     "latitude": storeLatlng.x,
                     "longitude": storeLatlng.y
                  }
               }
            },
            "routeModifiers": {"avoid_ferries": true}
         }
      ],
      "destinations": unassignedOrders.map(order => {
         return {
            "waypoint": {
               "location": {
                  "latLng": {
                     "latitude": order.delivery_latlng.x,
                     "longitude": order.delivery_latlng.y
                  }
               }
            }
         }
      }),
      "travelMode": "DRIVE",
      "routingPreference": "TRAFFIC_AWARE"
   }
   routeMat = await new Promise(resolve => {
      superagent
         .post('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix')
         .send(routeMatrixInput)
         .set('X-Goog-Api-Key', googleMapsApiKey)
         .set('X-Goog-FieldMask', 'originIndex,destinationIndex,duration,distanceMeters,status,condition')
         .end((err, res) => {
            if (err) throw err;
            resolve(res.body);
         })
   })

   // add the time estimate to the orders
   for (let i = 0; i < routeMat.length; i++) {
      let routeEntry = routeMat[i];
      let index = routeEntry.destinationIndex;
      unassignedOrders[index].timeEstimate = routeEntry.duration;
   }
   res.writeHead(200, {'Content-type': 'application/json'});
   res.end(JSON.stringify(unassignedOrders));
   // res.end(JSON.stringify(routeMat));
}

async function getAvailableDrivers(req, res, jwtBody, storeId) {
   let availableDrivers = await queryAvailableDrivers(storeId);

   res.writeHead(200, {'Content-type': 'application/json'});
   res.end(JSON.stringify(availableDrivers));
}


/**
 * helper function for /unassigned/{store_id}
 */
async function queryUnassignedOrders(storeId, numOrders) {

   let query = `select o.order_id, o.delivery_latlng, o.DT_created, c.username
      from customer_order o
      join customer_account c on o.ordered_by = c.cid
      where o.made_at = ${storeId} and
      o.status = "in transit"`;
   if (numOrders != undefined) {
      query += ` limit ${numOrders}`
   }
   return runQuery(employeePool, query)
}

async function queryStoreLatlng(storeId) {
   return (await runQuery(employeePool,
      `select latlng from store s where s.store_id = ${storeId}`))[0].latlng;
}

async function queryAvailableDrivers(storeId) {
   return runQuery(employeePool,
      `select e.eid, e.email, e.status
      from employee_account e
      where e.employee_type = "driver"
      and e.status = "idle"`)

}

/**
 * api endpoint
 * JSON body with numDrivers, maxPerDriver
 */
async function optimalAssignment(req, res, jwtBody, storeId) {

   let body = await new Promise(resolve => {
      let data = '';
      req.on('data', chunk => {
         data += chunk;
      })
      req.on('end', () => {
         resolve(data);
      })
   });
   let decodedData = JSON.parse(body);
   let numDrivers = decodedData.numDrivers;
   let maxPerDriver = decodedData.maxPerDriver;
   let maxOrders = numDrivers * maxPerDriver;

   // let routeMatrix = await getRouteMatrix(storeId, maxOrders);
   let routeMatrix = await loadExampleRouteMat();

   // calculate all assignments
   let numOrders = 3;
   maxPerDriver = 3;
   numDrivers = 3;
   let assignments = [];
   let recursiveAssign = function (curOrder, currentlyAssigned) {
      // base case: no more remaining
      if (curOrder == numOrders) {
         assignments.push(currentlyAssigned);
         return;
      }
      // iterate each driver and try to assign the next order to them
      for (let i = 0; i < numDrivers; i++) {
         // if current driver has too many, then skip them;
         if (currentlyAssigned[i].length == maxPerDriver) {
            continue;
         }
         // add order to the driver and recurse
         let curAssignedCopy = JSON.parse(JSON.stringify(currentlyAssigned));
         curAssignedCopy[i].push(curOrder);
         recursiveAssign(curOrder + 1, curAssignedCopy);
      }
   }
   // let remaining = Array.from(Array(numOrders).keys());
   let currentlyAssigned = new Array(numDrivers);
   for (let i = 0; i < numDrivers; i++) {
      currentlyAssigned[i] = [];
   }
   recursiveAssign(0, currentlyAssigned);


   res.writeHead(200, {'Content-type': 'application/json'});
   // res.end(JSON.stringify(routeMatrix));
   res.end(JSON.stringify(assignments));
}

/**
 * calculates the route matrix between mr pizza store and order locations
 * limited by numOrders
 */
async function getRouteMatrix(storeId, numOrders) {
   let orders = await queryUnassignedOrders(storeId, numOrders);
   let storeLatlng = await queryStoreLatlng(storeId);
   let makeWaypoint = (x, y) => {
      return {
         "location": {
            "latLng": {
               "latitude": x,
               "longitude": y
            }
         }
      };
   }

   let waypoints = orders.map(order => makeWaypoint(order.delivery_latlng.x, order.delivery_latlng.y));
   waypoints.push(makeWaypoint(storeLatlng.x, storeLatlng.y));

   let routeMatrixInput = {
      "origins": waypoints.map(w => {
         return {
            "waypoint": w,
            "routeModifiers": {"avoid_ferries": true}
         }
      }),
      "destinations": waypoints.map(w => {
         return {
            "waypoint": w
         }
      }),
      "travelMode": "DRIVE",
      "routingPreference": "TRAFFIC_AWARE"
   }
   routeMat = await new Promise(resolve => {
      superagent
         .post('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix')
         .send(routeMatrixInput)
         .set('X-Goog-Api-Key', googleMapsApiKey)
         .set('X-Goog-FieldMask', 'originIndex,destinationIndex,duration,distanceMeters,condition')
         .end((err, res) => {
            if (err) throw err;
            resolve(res.body);
         })
   })
   return routeMat;
}

/**
 * returns the stored route mat from the ./exampleRouteMat file
 */
async function loadExampleRouteMat() {
   let filepath = (__dirname).split(path.sep)
   filepath.push('exampleRouteMat.txt')
   filepath = filepath.join(path.sep);
   let fileContents = fs.readFileSync(filepath);
   return JSON.parse(fileContents);
}

/**
 *  helper function for handleCalculateOptimal
 *  calculates the optimal assignment of orders to drivers to
 *  minimize total customer wait time.
 *  @param routeMatrix [] result from querying route matrix, last index
 *   of origin and destination is mr pizza location.
 */
function calculateOptimalAssignment(routeMatrix, numDrivers, maxPerDriver) {

}

module.exports = {
   routes: [
      {
         method: 'POST',
         path: /^\/optimalAssignment\/[\d]+$/, // url: store id to assign from
         handler: handleWorksAt(optimalAssignment)
      },
      {
         method: 'GET',
         path: /^\/unassigned\/[\d]+$/, // url: store id to assign from
         handler: handleWorksAt(getUnassignedOrders)
      },
      {
         method: 'GET',
         path: /^\/availableDrivers\/[\d]+$/, // url: store id to assign from
         handler: handleWorksAt(getAvailableDrivers)
      }
   ]
}
