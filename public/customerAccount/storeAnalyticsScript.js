window.addEventListener("load", async (event) => {
    console.log("page is fully loaded");
 });


async function setDatesTotalRevenue(){
    let startDate = document.getElementById("enterStartDateTotal").value;
    let endDate = document.getElementById("enterEndDateTotal").value;
    // console.log(startDate);
    if (startDate == '' || endDate == ''){
        // console.log("In id");
        alert("Please complete date fields");
        return;
    }
    // console.log("start:" + startDate);
    // console.log("end: " + endDate);
    let response = await fetch("/getTotalCompanyRevenue", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({startDate: startDate, endDate: endDate})
    });
    
    let totalRevenue = await response.json();
    console.log(totalRevenue);

    document.getElementById('totalCompanyRevenueTable').innerHTML = tableFromJSONArray([totalRevenue]);
}

async function setEmployeesByStore(){
    let response = await fetch("/getEmployeeCountByStore", {
        method: 'GET',
    });
    
    let data = await response.json();
    console.log(data);

    document.getElementById('employeeCountByStore').innerHTML = tableFromJSONArray(data);
}

async function setTotalCustomers(){
    let response = await fetch("/getTotalCustomers", {
        method: 'GET',
    });
    
    let data = await response.json();
    console.log(data);

    document.getElementById('totalCustomers').innerHTML = tableFromJSONArray([ data ]);
}
async function setTotalEmployees(){
    let response = await fetch("/getTotalEmployees", {
        method: 'GET',
    });
    
    let data = await response.json();
    console.log(data);

    document.getElementById('totalEmployees').innerHTML = tableFromJSONArray([ data ]);
}
async function setMenuPop(){
    let response = await fetch("/getMenuItemsSortedByPopularity", {
        method: 'GET',
    });
    
    let data = await response.json();
    console.log(data);

    document.getElementById('menuPop').innerHTML = tableFromJSONArray(data);
}
async function setMenuRev(){
    let response = await fetch("/getRevenueTotalByMenuItem", {
        method: 'GET',
    });
    
    let data = await response.json();
    console.log(data);

    document.getElementById('menuRev').innerHTML = tableFromJSONArray(data);
}
async function setPopToppings(){
    let response = await fetch("/getMostPopularToppings", {
        method: 'GET',
    });
    
    let data = await response.json();
    console.log(data);

    document.getElementById('popToppings').innerHTML = tableFromJSONArray(data);
}
/**
 * generates the contents of a table given an array of json objects
 */
function tableFromJSONArray(array) {
    console.log(array)
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
