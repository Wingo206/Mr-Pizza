const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
let store_id;
let checkboxIds;
let eidsToAssign = [];
let map;
let storeMarker;
let markers = [];
let directionsRenderers = [];
let pendingAssignment;

const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];

window.addEventListener("load", async (event) => {
   console.log("page is fully loaded");
   refreshData();
});

async function initMap() {
   const { Map } = await google.maps.importLibrary("maps");

   map = new Map(document.getElementById("map"), {
      center: { lat: 40.523421858838276, lng: -74.45823918823967 },
      zoom: 15,
      mapId: '5f088c2dddf9c012'
   });
   map.addListener('click', (event) => {
      event.stop();
   })
}
initMap();

async function refreshData() {
   // remove all old markers
   for (let i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
   }
   // reset the renders on the map
   directionsRenderers.forEach(dr => dr.setMap(null));
   directionsRenderers = [];

   // fetch which store the currently logged in employee works for
   let resp = await fetch('/employeeStoreInfo', {
      method: 'GET'
   })
   let esInfo = await resp.json();
   console.log(esInfo)
   document.getElementById('userInfo').innerHTML = `You are signed in as ${esInfo.email}, 
      working for store id ${esInfo.store_id} (${esInfo.address})`

   // add marker for the store
   markers.push(new AdvancedMarkerElement({
      map,
      position: { lat: Number(esInfo.latlng.x), lng: Number(esInfo.latlng.y) },
   }));


   // fetch the unassigned orders
   store_id = esInfo.store_id;
   resp = await fetch(`/unassigned/${store_id}`, {
      method: 'GET'
   })
   let unassignedOrders = await resp.json();
   console.log(unassignedOrders);
   document.getElementById('unassignedOrdersTable').innerHTML = tableFromJSONArray(unassignedOrders)

   // add marker for each order
   for (let i = 0; i < unassignedOrders.length; i++) {
      let order = unassignedOrders[i];
      markers.push(new AdvancedMarkerElement({
         map,
         position: { lat: Number(order.delivery_latlng.x), lng: Number(order.delivery_latlng.y) },
      }));
   }

   // fetch the available drivers
   resp = await fetch(`/availableDrivers/${store_id}`, {
      method: 'GET'
   })
   let availableDrivers = await resp.json();
   console.log(availableDrivers);
   // kind of a hack: add in a checkbox for each one
   checkboxIds = [];
   for (let i = 0; i < availableDrivers.length; i++) {
      let entry = availableDrivers[i];
      checkboxIds.push(entry.eid);
      entry["Assign?"] = `<input type=checkbox id=assignCheckbox${entry.eid} onclick=onCheckboxClicked()>`
   }
   document.getElementById('availableDriversTable').innerHTML = tableFromJSONArray(availableDrivers)
   window.onCheckboxClicked();
}

window.onCheckboxClicked = () => {
   // iterate through the checkboxIds and see which ones are checked
   eidsToAssign = [];
   for (let i = 0; i < checkboxIds.length; i++) {
      let checkbox = document.getElementById('assignCheckbox' + checkboxIds[i]);
      if (checkbox.checked) {
         eidsToAssign.push(checkboxIds[i]);
      }
   }
   // update the form display
   document.getElementById('currentlyAssigning').innerHTML =
      `Currently assigning (${eidsToAssign.length}) drivers: ${JSON.stringify(eidsToAssign)}`
}

window.fetchAssign = async () => {
   let maxPerDriver = document.getElementById('maxPerDriver').value;
   let resp = await fetch(`/optimalAssignment/${store_id}`, {
      method: 'POST',
      headers: {
         "Content-type": 'application/json',
      },
      body: JSON.stringify({ drivers: eidsToAssign, maxPerDriver: maxPerDriver })
   })
   if (resp.status == 200) {
      let assignment = await resp.json();
      pendingAssignment = assignment;
      console.log(assignment);

      // reset the renders on the map
      directionsRenderers.forEach(dr => dr.setMap(null));
      directionsRenderers = [];

      // fetch the waypoints for each driver's assignment
      for (let i = 0; i < assignment.length; i++) {
         let group = assignment[i];
         let resp2 = await fetch(`/directions/waypoints/${store_id}`, {
            method: 'POST',
            headers: {
               "Content-type": 'application/json',
            },
            body: JSON.stringify({ orders: group.orders })
         })
         if (resp2.status == 200) {
            let waypoints = await resp2.json();
            console.log(waypoints);
            // get directions and render on map
            displayDirections(waypoints, i);
         } else {
            console.log(await resp2.text());
         }
      }

   } else {
      alert(await resp.text());
   }
}

/**
 * iterate the pendingAssignments and send them to the server
 */
window.confirmAssignments = async () => {
   for (let i = 0; i < pendingAssignment.length; i++) {
      let singleAssignment = pendingAssignment[i];

      let resp = await fetch(`/assignOrders/${store_id}`, {
         method: 'POST',
         headers: {
            "Content-type": 'application/json',
         },
         body: JSON.stringify(singleAssignment)
      })
      if (resp.status == 200) {
         console.log(await resp.text());
      } else {
         alert(await resp.text());
         return;
      }
   }
   // reload the data
   await refreshData();
}

function displayDirections(waypoints, colorIndex) {
   const { DirectionsService } = google.maps;
   const directionsService = new DirectionsService();
   for (let i = 0; i < waypoints.length - 1; i++) {

      var polylineOptionsActual = new google.maps.Polyline({
         strokeColor: colors[colorIndex % colors.length],
         // strokeOpacity: 1.0,
         // strokeWeight: 10
      });
      let directionsRenderer = new google.maps.DirectionsRenderer({
         suppressMarkers: true,
         polylineOptions: polylineOptionsActual
      });
      directionsRenderers.push(directionsRenderer);
      directionsRenderer.setMap(map);
      // directionsRenderer.setPanel(document.getElementById("sidebar"));

      let origin = waypoints[i];
      let destination = waypoints[i + 1];

      const request = {
         origin: { lat: origin.x, lng: origin.y },
         destination: { lat: destination.x, lng: destination.y },
         travelMode: google.maps.TravelMode.DRIVING,
      }
      console.log(request)


      directionsService.route(request, (result, status) => {
         if (status == 'OK') {
            console.log('Status ok')
            directionsRenderer.setDirections(result);
         } else {
            console.log('Status not ok')
            console.log(status);
         }
      });
   }
}

/**
 * generates the contents of a table given an array of json objects
 */
function tableFromJSONArray(array) {
   if (array.length == 0) {
      return '';
   }
   let output = '';
   let keys = Object.keys(array[0]);
   output += `<tr>`
   for (let i = 0; i < keys.length; i++) {
      output += `<th>`
      output += `${keys[i]}`
      output += `</th>`
   }
   output += `</tr>`
   for (let i = 0; i < array.length; i++) {
      output += `<tr>`
      let entry = array[i];
      for (let j = 0; j < keys.length; j++) {
         output += `<td>`
         let str = JSON.stringify(entry[keys[j]]);
         str = str.replace(/^"/, '');
         str = str.replace(/"$/, '');
         output += `${str}`
         output += `</td>`
      }
      output += `</tr>`
   }
   return output;
}
