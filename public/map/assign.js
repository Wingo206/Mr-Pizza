let store_id;
let checkboxIds;
let eidsToAssign = [];

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
      body: JSON.stringify({drivers: eidsToAssign, maxPerDriver: maxPerDriver})
   })
   if (resp.status == 200) {
      console.log("yay");
      console.log(await resp.json());
   } else {
      alert(await resp.text());
   }
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
