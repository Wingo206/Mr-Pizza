window.addEventListener("load", async(event) => {
    console.log("page is fully loaded");
    await refresh();
});

async function refresh(){
    let resp = await fetch('/getEmployeeInfo', {
        method: 'GET'
    });

    let employeeInfo = await resp.json();
    console.log(employeeInfo);

    document.getElementById('employeeInfoTable').innerHTML = tableFromJSONArray(employeeInfo);
}


function tableFromJSONArray(employeeInfo){
    let output = '<th>Employee Store ID</th><th>Employee Type</th><th>Status</th>';
    output += '<tr>';
    output += `<td>${JSON.stringify(employeeInfo.works_at)}</td>`;
    output += `<td>${JSON.stringify(employeeInfo.employee_type)}</td>`;
    output += `<td>${JSON.stringify(employeeInfo.status)}</td>`;
    output += '</tr>';
    // console.log("Hello");
    
    return output;    
}