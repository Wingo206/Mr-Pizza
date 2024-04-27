window.addEventListener("load", async (event) => {
    console.log("page is fully loaded");
    await refresh();
 });

 async function refresh(){
    let resp = await fetch("/getEmployeeCountByStore", {
        method: 'GET'
    })
    
    let employeeCount = await resp.json();
    console.log(employeeCount);
    document.getElementById('employeeCountByStore').innerHTML = tableFromJSONArrayEmployee(employeeCount);
 } 

function tableFromJSONArrayEmployee(employeeCount){
    let output = '';
    if (employeeCount == "No data found"){
        output = '<tr><td>No data found</td></tr>';
        return output;
    }
    return output;
}

function tableFromJSONArrayTotalRevnue(totalRevenue){
    let output = '';
    if (totalRevenue == 'No data found'){
        output = '<tr><td>No data found</td></tr>';
        return output;
    }
    return output;
}

function tableFromJSONArrayMonthlyRevenue(monthlyRevenue){
    let output = '';
    if (monthlyRevenue == 'No data found'){
        output = '<tr><td>No data found</td></tr>';
        return output;
    }
    return output;
}

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

    document.getElementById('totalCompanyRevenueTable').innerHTML = tableFromJSONArrayTotalRevnue(totalRevenue);
}

async function setDatesMonthlyRevenue(){
    let startDate = document.getElementById("enterStartDateMonth").value;
    let endDate = document.getElementById("enterEndDateMonth").value;
    if (startDate == '' || endDate == ''){
        // console.log("In id");
        alert("Please complete date fields");
        return;
    }
    let response = await fetch('/getTotalCompanyRevenueByMonth', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({startDate: startDate, endDate: endDate})
    })

    let monthlyRevenue = await response.json();
    console.log(monthlyRevenue);

    document.getElementById("monthlyCompanyRevenueTable").innerHTML = tableFromJSONArrayMonthlyRevenue(monthlyRevenue);
}