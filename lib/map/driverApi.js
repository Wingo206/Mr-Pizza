const {handleAuth, authRoles, handleWorksAt} = require("../authApi");
const {employeePool, runQuery} = require("../util/database_util");
const superagent = require('superagent');
const {googleMapsApiKey} = require("../util/config");


async function assignDeliveryBatches(req, res, jwtBody, storeId) {

   res.writeHead(200, {'Content-type': 'text/plain'});
   res.end('hello');
}

/**
 * api endpoint.
 * get JSON list of orders for a given store which are ready for delivery
 * but not yet assigned (status = "in transit" and not in in_batch)
 * gets the estimated delivery time for each order.
 */
async function getUnassignedOrders(req, res, jwtBody, storeId) {
   let unassignedOrders = await runQuery(employeePool,
      `select order_id, delivery_latlng, DT_created, ordered_by 
      from customer_order o
      where o.made_at = ${storeId} and
      o.status = "in transit"`)
   let storeLatlng = (await runQuery(employeePool,
      `select latlng from store s where s.store_id = ${storeId}`))[0].latlng;
   console.log(storeLatlng)
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

module.exports = {
   routes: [
      {
         method: 'GET', // TODO change to post
         path: /^\/assignBatches\/[\d]+$/, // url: store id to assign from
         handler: handleWorksAt(assignDeliveryBatches)
      },
      {
         method: 'GET',
         path: /^\/unassigned\/[\d]+$/, // url: store id to assign from
         handler: handleWorksAt(getUnassignedOrders)
      },
   ]
}
