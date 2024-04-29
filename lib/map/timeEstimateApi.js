const { runQuery, employeePool, customerPool } = require("../util/database_util");
const { handleWorksAt, handleAuth, authRoles } = require("../authApi.js");
const { getJSONBody } = require("../util/inputValidationUtil.js");
const superagent = require('superagent');
const { googleMapsApiKey } = require("../util/config");

/**
 * helper function that takes two points and outputs the time estimate
 * startPos, endPos: {x, y}
 */
async function calcTimeEstimate(startPos, endPos) {

   // get estimated driving times
   let routeMatrixInput = {
      "origins": [
         {
            "waypoint": {
               "location": {
                  "latLng": {
                     "latitude": startPos.x,
                     "longitude": startPos.y
                  }
               }
            },
            "routeModifiers": { "avoid_ferries": true }
         }
      ],
      "destinations": [
         {
            "waypoint": {
               "location": {
                  "latLng": {
                     "latitude": endPos.x,
                     "longitude": endPos.y
                  }
               }
            }
         }
      ],
      "travelMode": "DRIVE",
      "routingPreference": "TRAFFIC_AWARE"
   }
   // console.log(JSON.stringify(routeMatrixInput));
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
   try {
      let duration = routeMat[0].duration;
      duration = Number(duration.slice(0, duration.length - 1));
      return duration;
   } catch (e) {
      console.error(e);
   }
}

// calcTimeEstimate({x: 40.51779689219855, y:-74.46130942926905}, {x: 40.52789393928404, y:-74.46689643063273})

async function getOrderTimeEstimate(req, res, jwtBody) {
   try {
      // query to select my order
      let queryRes = await runQuery(customerPool,
         `select c.order_id
        from customer_order c
        where c.ordered_by = ${jwtBody.id}
        order by c.DT_created desc
        limit 1;         
        `)

      let myOrder = queryRes[0].order_id;

      // gets the order ids of all orders in the same delivery batch
      let queryRes2 = await runQuery(customerPool,
         `select c.order_id, c.delivery_latlng, i.order_index
        from customer_order c
        join in_batch i on c.order_id = i.order_id
        where c.status = 'In-Transit'
        and batch_id = (select i.batch_id from in_batch i where i.order_id = ?)
        ORDER BY i.order_index asc; `, myOrder);
      // inbatch join customer_order, 

      // uses helper function to calculate the time between driver and first index and etc.
      let queryRes3 = await runQuery(customerPool,
         `select current_latlng
        from customer_order c
        join in_batch i on i.order_id = c.order_id
        join delivery_batch d on d.batch_id = i.batch_id
        where c.ordered_by = ${jwtBody.id}`);

      let totalDuration = 0;
      let curPosition = queryRes3[0].current_latlng; // DRIVER POSITION
      for (let i = 0; i < queryRes2.length; i++) {
         let nextPosition = queryRes2[i].delivery_latlng; // FIRST ORDER POSITION
         totalDuration += await calcTimeEstimate(curPosition, nextPosition);
         // break if we are at our order
         if (queryRes2[i].order_id == myOrder) {
            break;
         }
         // iterate to next pair
         curPosition = nextPosition;
      }
      console.log(totalDuration);

      res.writeHead(200, { 'Content-type': 'application/json' });
      res.end(JSON.stringify({timeEstimate: totalDuration}));


   } catch (e) {
      console.error(e);
      res.writeHead(500, { 'Content-type': 'application/json' });
      res.end(JSON.stringify({error: "A server error occurred."}));
   }
}

/**
 * get store time estimates
 */
async function getStoreTimeEstimate(req, res, jwtBody) {

}

module.exports = {
   routes: [
      {
         method: 'GET',
         path: '/timeEst/getOrderTimeEst',
         handler: handleAuth(authRoles.customer, getOrderTimeEstimate)
      }
   ]
}