const {handleAuth, authRoles, handleWorksAt} = require("../authApi");
const {employeePool, runQuery} = require("../util/database_util");
const superagent = require('superagent');
const {googleMapsApiKey} = require("../util/config");
const path = require('path');
const fs = require('node:fs');
const {getJSONBody} = require("../util/inputValidationUtil");


/**
 * api endpoint.
 * get JSON list of orders for a given store which are ready for delivery
 * but not yet assigned (status = "in transit" and not in in_batch)
 * gets the estimated delivery time for each order.
 */
async function getUnassignedOrders(req, res, jwtBody, storeId) {
   let unassignedOrders = await queryUnassignedOrders(storeId);
   let storeLatlng = await queryStoreLatlng(storeId);
   if (unassignedOrders.length == 0) {
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify([]));
      return;
   }
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

   let query = `select o.order_id, o.delivery_latlng, o.DT_created,
   c.username, timestampdiff(second, o.DT_created, utc_timestamp()) timeSinceCreation
      from customer_order o
      join customer_account c on o.ordered_by = c.cid
      where o.made_at = ${storeId} 
      and o.status = "in transit"
      and o.order_id not in (
         select order_id
         from in_batch
      )`;
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
 *  calculates the optimal assignment of orders to drivers to
 *  minimize total customer wait time.
 * JSON body with drivers: array of eids, maxPerDriver: num
 */
async function optimalAssignment(req, res, jwtBody, storeId) {

   // read inputs from the request body
   let decodedData = await getJSONBody(req, res, ['drivers', 'maxPerDriver']);
   if (!decodedData) {
      return;
   }

   let drivers = decodedData.drivers;
   if (!Array.isArray(drivers) || drivers.length == 0) {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end('non-empty drivers array required');
      return;
   }
   // ensure that drivers are available and exist
   let availableDrivers = await queryAvailableDrivers(storeId);

   for (let i = 0; i < drivers.length; i++) {
      let found = false;
      for (let j = 0; j < availableDrivers.length; j++) {
         if (drivers[i] == availableDrivers[j].eid) {
            found = true;
         }
      }
      if (!found) {
         res.writeHead(400, {'Content-type': 'text/plain'});
         res.end(`Driver with id ${drivers[i]} is not available.`);
         return;
      }
   }

   let numDrivers = drivers.length;
   let maxPerDriver = Number(decodedData.maxPerDriver);
   console.log(maxPerDriver)
   console.log(Number.isInteger(maxPerDriver))
   if (!Number.isInteger(maxPerDriver) || maxPerDriver < 1) {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end('Positive Integer required for maxPerDriver');
      return;
   }
   let maxOrders = numDrivers * maxPerDriver;

   // fetch the max amount of unassigned orders
   let orders = await queryUnassignedOrders(storeId, maxOrders);
   let numOrders = orders.length;

   let routeMatrix = await getRouteMatrix(storeId, orders);
   // let routeMatrix = await loadExampleRouteMat();

   // calculate all assignments, all values are indices, not ids
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
   let currentlyAssigned = new Array(numDrivers);
   for (let i = 0; i < numDrivers; i++) {
      currentlyAssigned[i] = [];
   }
   recursiveAssign(0, currentlyAssigned);

   // extract time estimates from route matrix
   let routeMatArr = [];
   for (let i = 0; i < numOrders + 1; i++) {
      routeMatArr.push(new Array(numOrders + 1));
   }

   for (let i = 0; i < routeMatrix.length; i++) {
      let entry = routeMatrix[i];
      let durationNum = Number(entry.duration.match(/[\d]+/)[0]);
      routeMatArr[entry.originIndex][entry.destinationIndex] = durationNum;
   }
   console.log(routeMatArr);

   // calculate table of route permutations to customer delay for 
   // all sets that we need
   let permutationTable = {};
   let bestAssignmentIndex = 0;
   let bestAssignmentScore = Number.MAX_VALUE;
   for (let i = 0; i < assignments.length; i++) {
      let assignment = assignments[i];
      let curAssignmentScore = 0;
      for (let j = 0; j < assignment.length; j++) {
         let grouping = assignment[j];
         let key = JSON.stringify(grouping);
         if (!permutationTable.hasOwnProperty(key)) {
            // calculate all permutations if we haven't yet
            permutations = [];
            calculatePermutations(grouping, [], permutations);
            // get the best score out of these permutations
            let bestIndex = 0;
            let bestScore = Number.MAX_VALUE;
            for (let k = 0; k < permutations.length; k++) {
               let curPerm = permutations[k];
               let arrivalTimes = [];
               let curTime = 0;
               let curLocIndex = numOrders; // start at mrPizza
               for (let l = 0; l < curPerm.length; l++) {
                  let nextLocIndex = curPerm[l];
                  curTime += routeMatArr[curLocIndex][nextLocIndex];
                  curLocIndex = nextLocIndex;
                  arrivalTimes[l] = curTime;
                  // add amount of time in between
                  curTime += 60;
               }
               // calculate the score for this permutation
               let score = 0;
               for (let l = 0; l < arrivalTimes.length; l++) {
                  let timeSinceCreation = orders[curPerm[l]].timeSinceCreation;
                  let totalCustWait = arrivalTimes[l] + timeSinceCreation;
                  score += Math.pow(totalCustWait, 2);
               }
               // console.log(JSON.stringify(curPerm) + ": " + score)
               // if better than the best permutation, then update
               if (score < bestScore) {
                  bestScore = score;
                  bestIndex = k;
               }
            }
            // store the best score and permutation in the table
            permutationTable[key] = {
               perm: permutations[bestIndex],
               score: bestScore
            }
         }
         // get the best permutation's score, add to the score of this assignment
         curAssignmentScore += permutationTable[key].score;
      }
      if (curAssignmentScore < bestAssignmentScore) {
         bestAssignmentIndex = i;
         bestAssignmentScore = curAssignmentScore;
      }
   }
   console.log(permutationTable);
   let bestAssignment = assignments[bestAssignmentIndex];
   // get the best permutations for each group
   for (let i = 0; i < bestAssignment.length; i++) {
      let group = bestAssignment[i];
      bestAssignment[i] = permutationTable[JSON.stringify(group)].perm;
   }
   console.log(bestAssignment)

   // assign order ids to drivers
   let output = [];
   for (let i = 0; i < bestAssignment.length; i++) {
      let group = bestAssignment[i];
      let entry = {};
      entry.eid = drivers[i];
      entry.orders = group.map(j => orders[j].order_id);
      output.push(entry);
   }

   res.writeHead(200, {'Content-type': 'application/json'});
   res.end(JSON.stringify(output));
}

/**
 * calculates all permutations of the input array
 */
function calculatePermutations(remaining, current, accumulation) {
   if (remaining.length == 0) {
      accumulation.push(current);
      return;
   }

   for (let i = 0; i < remaining.length; i++) {
      let remCopy = JSON.parse(JSON.stringify(remaining));
      let curCopy = JSON.parse(JSON.stringify(current));
      let val = remCopy[i];
      remCopy.splice(i, 1);
      curCopy.push(val);
      calculatePermutations(remCopy, curCopy, accumulation)
   }
}

/**
 * calculates the route matrix between mr pizza store and order locations
 * limited by numOrders
 */
async function getRouteMatrix(storeId, orders) {
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
 * Api endpoint.
 * Inputs: JSON body with eid, orders array
 */
async function assignOrders(req, res, jwtBody, storeId) {
   // read inputs from the request body
   let decodedData = await getJSONBody(req, res, ['orders', 'eid']);
   if (!decodedData) {
      return;
   }

   let eid = decodedData.eid;
   let orders = decodedData.orders;
   if (!Number.isInteger(eid)) {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end('integer eid values are required');
      return;
   }

   if (!Array.isArray(orders) || orders.length == 0) {
      res.writeHead(400, {'Content-type': 'text/plain'});
      res.end('non-empty orders array required');
      return;
   }
   // ensure that orders are unassigned and exist
   let unassignedOrders = await queryUnassignedOrders(storeId);

   for (let i = 0; i < orders.length; i++) {
      let found = false;
      for (let j = 0; j < unassignedOrders.length; j++) {
         if (orders[i] == unassignedOrders[j].order_id) {
            found = true;
         }
      }
      if (!found) {
         res.writeHead(400, {'Content-type': 'text/plain'});
         res.end(`Order with id ${orders[i]} is not available.`);
         return;
      }
   }

   // check if the driver exists
   let existRes = await runQuery(employeePool,
      `select * from employee_account where eid = ${eid}`);
   if (existRes.length == 0) {
      res.writeHead(400, {'Content-type': 'text/plain'})
      res.end('Driver does not exist');
      return;
   }

   // check if the driver is already assigned a batch
   let checkRes = await runQuery(employeePool,
      `select * from delivery_batch where assignedToEmp = ${eid}`);
   if (checkRes.length != 0) {
      res.writeHead(400, {'Content-type': 'text/plain'})
      res.end('Driver is not available');
      return;
   }

   // add the delivery batch
   let batchRes = await runQuery(employeePool,
      `insert into delivery_batch(driver_status, assignedToEmp) values ("idle", ${eid})`);
   let batchId = (await runQuery(employeePool,
      `select batch_id from delivery_batch where assignedToEmp = ${eid}`))[0].batch_id;

   // add all the orders to the batch
   let inbatchQuery = `insert into in_batch(order_id, batch_id, order_index) values `;
   inbatchQuery += orders.map((o, i) => `(${o}, ${batchId}, ${i})`).join(', ')
   let inbatchRes = await runQuery(employeePool, inbatchQuery);

   // set status of the driver
   let updateDriverRes = await runQuery(employeePool,
      `update employee_account set status = "assigned" where eid = ${eid}`)

   res.writeHead(200, {'Content-type': 'text/plain'})
   res.end('Orders assigned successfully');
}

/**
 *  helper function for handleCalculateOptimal
 *  @param routeMatrix [] result from querying route matrix, last index
 *   of origin and destination is mr pizza location.
 */
function calculateOptimalAssignment(routeMatrix, numDrivers, maxPerDriver) {

}

module.exports = {
   queryStoreLatlng,
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
      },
      {
         method: 'POST',
         path: /^\/assignOrders\/[\d]+$/, // url: store id to assign from
         handler: handleWorksAt(assignOrders)
      }
   ]
}
