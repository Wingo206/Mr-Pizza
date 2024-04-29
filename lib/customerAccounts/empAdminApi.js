const { decode } = require("jsonwebtoken");
const {authPool, runQuery, employeePool} = require("../util/database_util.js");
const { getJSONBody } = require("../util/inputValidationUtil.js");


async function addNewEmployee(req, res){
    let decodedData = await getJSONBody(req, res, ['employeeFirstName', 'employeeLastName', 'employeeStoreId']);
    if (!decodedData){
        return;
    }

    // console.log(decodedData);
    let name = decodedData.employeeFirstName + " " + decodedData.employeeLastName;
    let email = decodedData.employeeFirstName.toLowerCase() + decodedData.employeeLastName.toLowerCase() + "@mrpizza.com";
    let works_at = decodedData.employeeStoreId;
    let password = decodedData.employeeFirstName + decodedData.employeeLastName;

    rows = await runQuery(authPool, `select 1 from store where store_id = ${works_at}`);
    if (rows == 0){
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.end("No stores with id " + works_at);
        return;
    }

    try {
        let insertRes = await runQuery(authPool, `insert into employee_account(name, email, password_hash, works_at) values ("${name}", "${email}", "${password}", ${works_at})`);
        res.writeHead(201, {"Content-Type": "text/plain"})
        res.end("Successfully added employee");
    }
    catch(e){
        console.log(e);
        res.writeHead(500, {"Content-Type": 'text/plain'});
        res.end('Internal server error');
        return;
    }
 }

 async function assignExistingEmployee(req, res){
    let decodedData = await getJSONBody(req, res, ['employeeId', 'newEmployeeStoreId']);
    if (!decodedData){
        return;
    }

    const rows = await runQuery(authPool, `select 1 from store where store_id = ${decodedData.newEmployeeStoreId}`);
    if (rows == 0){
        res.writeHead(400, {"Content-Type": "text/plain"});
        res.end("No stores with id " + decodedData.newEmployeeStoreId);
        return;
    }

    try{
        let updateRes = await runQuery(employeePool, `UPDATE employee_account SET works_at = ${decodedData.newEmployeeStoreId} WHERE eid = ${decodedData.employeeId}`);
        if (updateRes.affectedRows == 0){
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.end("No employee found with the id " + decodedData.employeeId);
            return;
        }
        if (updateRes.changedRows == 0){
            res.writeHead(404, {"Content-Type": 'text/plain'});
            res.end("Employee already assigned to store of id " + decodedData.newEmployeeStoreId);
            return;
        }
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.end("Successfully assigned employee");
    }
    catch(e){
        console.log(e);
        res.writeHead(500, {"Content-Type": 'text/plain'});
        res.end("Internal server error");
        return;
    }
 }

 module.exports = {
    routes: [
       {
          method: 'POST',
          path: '/admin/addNewEmployee',
          handler: addNewEmployee
       },
       {
          method: "POST",
          path: '/admin/assignExistingEmployee',
          handler: assignExistingEmployee
       }
    ]
 };
 