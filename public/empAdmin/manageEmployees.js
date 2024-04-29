async function addNewEmployee(){
    // console.log("Added");
    let employeeFirstName = document.getElementById('employeeFirstName').value.trim();
    let employeeLastName = document.getElementById('employeeLastName').value.trim();
    let employeeStoreId = document.getElementById('employeeStoreId').value;
    if(employeeFirstName == '' || employeeLastName == '' || employeeStoreId == ''){
        alert("Please complete all fields");
        return;
    }
    if (isNaN(employeeStoreId) || !(/^\d+$/.test(employeeStoreId))){
        alert("Store ID must be an integer");
        return;
    }
    let resp = await fetch('/admin/addNewEmployee', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({employeeFirstName: employeeFirstName, employeeLastName: employeeLastName, employeeStoreId: employeeStoreId})
    });

    console.log(resp);


    if (resp.status == 201){
        alert("Employee added successfully");
    }
    else if (resp.status == 500){
        alert("Error");
    }
    else if (resp.status == 404){
        alert("No store with id " + employeeStoreId);
    }
    

    // console.log(newEmployeeData);
}

async function assignEmployee(){
    // console.log("Assigned");
    let employeeId = document.getElementById('employeeId').value;
    let newEmployeeStoreId = document.getElementById('newEmployeeStoreId').value;
    if (employeeId == '' || newEmployeeStoreId == ''){
        alert("Please complete all fields");
        return;
    }
    
    if (isNaN(employeeId) || !(/^\d+$/.test(employeeId)) || isNaN(newEmployeeStoreId) || !(/^\d+$/.test(newEmployeeStoreId))){
        alert("IDs must be of type integer");
        return;
    }
    let resp = await fetch('/admin/assignExistingEmployee', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({employeeId: employeeId, newEmployeeStoreId: newEmployeeStoreId})
    });

    console.log(resp);

    if (resp.status == 200){
        alert("Employee successfully assigned to new store");
    }
    else if (resp.status == 500){
        alert("Internal server error");
    }
    else if (resp.status == 404){
        alert("Either employee with id " + employeeId + " does not exist or employee already assigned to store with id " + newEmployeeStoreId);
    }
    else if (resp.status == 400){
        alert("No stores with id " + newEmployeeStoreId + " exists");
    }

}