let store_id

window.addEventListener("load", async (event) => {
   console.log("page is fully loaded");
   refresh();
});

async function refresh() {
   // fetch which store the currently logged in employee works for

   let resp = await fetch('/employeeStoreInfo', {
      method: 'GET'
   })
   let esInfo = await resp.json();
   console.log(esInfo)
   document.getElementById('userInfo').innerHTML = `You are signed in as ${esInfo.email}, 
      working for store id ${esInfo.store_id} (${esInfo.address})`

   // fetch the unassigned orders
   store_id = esInfo.store_id;
   resp = await fetch(`/unassigned/${store_id}`, {
      method: 'GET'
   })
   let unassignedOrders = await resp.json();
   console.log(unassignedOrders);
   document.getElementById('unassignedOrdersTable').innerHTML = tableFromJSONArray(unassignedOrders)

   // fetch the available drivers
   resp = await fetch(`/availableDrivers/${store_id}`, {
      method: 'GET'
   })
   let availableDrivers = await resp.json();
   console.log(availableDrivers);
   document.getElementById('availableDriversTable').innerHTML = tableFromJSONArray(availableDrivers)
}

/**
 * generates the contents of a table given an array of json objects
 */
function tableFromJSONArray(array) {
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
         output += `${JSON.stringify(entry[keys[j]])}`
         output += `</td>`
      }
      output += `</tr>`
   }
   return output;
}
