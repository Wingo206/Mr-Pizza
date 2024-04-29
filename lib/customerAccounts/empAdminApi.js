const { decode } = require("jsonwebtoken");
const {adminPool, authPool, runQuery, employeePool} = require("../util/database_util.js");
const { getJSONBody } = require("../util/inputValidationUtil.js");
const { registerAccount, handleAuth } = require("../authApi.js");
const {authRoles} = require('../authApi.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { TargetType } = require("puppeteer");
const saltRounds = 10;


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

    rows = await runQuery(adminPool, `select 1 from store where store_id = ${works_at}`);
    if (rows == 0){
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.end("No stores with id " + works_at);
        return;
    }

    try {
        // let insertRes = await runQuery(adminPool, `insert into employee_account(name, email, password_hash, works_at) values ("${name}", "${email}", "${password}", ${works_at})`);
        let eid = await addEmployee(authRoles.employee, email, password);
        console.log(eid[0].id);
        await runQuery(adminPool, `UPDATE employee_account SET name = '${name}', works_at = ${works_at} where eid = ${eid[0].id}`)
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

    const rows = await runQuery(adminPool, `select 1 from store where store_id = ${decodedData.newEmployeeStoreId}`);
    if (rows == 0){
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.end("No stores with id " + decodedData.newEmployeeStoreId);
        return;
    }

    try{
        let updateRes = await runQuery(adminPool, `UPDATE employee_account SET works_at = ${decodedData.newEmployeeStoreId} WHERE eid = ${decodedData.employeeId}`);
        if (updateRes.affectedRows == 0){
            res.writeHead(400, {"Content-Type": "text/plain"});
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

 async function addEmployee(authRole, userEmail, password) {
    // Generate the bcrypt hash
    let hash = await new Promise(resolve => {
        bcrypt.hash(password, saltRounds, (err, hash) => {
           resolve(hash);
        });
     })
 
     let res;
     if (authRole == authRoles.employee) {
        res = await runQuery(authPool, `insert into
        employee_account(email, password_hash) values
        ("${userEmail}", "${hash}")`)
     } else {
        throw new Error('Invalid auth role');
     }
     let newQuery = `select eid as id, password_hash from employee_account e where e.email = "${userEmail}"`;
     let result = await runQuery(employeePool, newQuery, [userEmail, password]);
    console.log(result);
    return result; // Return the ID of the newly inserted row
 }

 async function getEmployeeInfo(req, res, jwtBody){
    const contentType = req.headers['content-type'];
    if (contentType != 'application/json') {
        res.writeHead(415, {'Content-Type': 'text/plain'});
        res.end('json body required');
        return;
     }
  
     let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => {
           data += chunk;
        })
        req.on('end', () => {
           resolve(data);
        })
     });
     let decodedData = JSON.parse(body);

     try{
        let updateQuery = `UPDATE employee_account SET`;
        let updates = [];

        for (const key in decodedData) {
            if (decodedData.hasOwnProperty(key) && decodedData[key].length > 0){
                updated.push(`${key} = '${decodedData[key]}'`);
            }
        }
        if (updates.length == 0){
            res.writeHead(400, {"Content-Type": "text/plain"});
            res.end("No data provided");
            return;
        }

        updateQuery += updates.join(', ');
        updateQuery += ` WHERE eid = ${jwtBody.id}`;

        await runQuery(employeePool, updateQuery);
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.end("Successfully updated");
     }
     catch(e){
        console.log(e);
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.end("Internal server error");
     }
 }

 async function editEmployeeInfo(req, res, jwtBody){
    const contentType = req.headers['content-type'];
    if (contentType != 'application/json') {
        res.writeHead(415, {'Content-Type': 'text/plain'});
        res.end('json body required');
        return;
    }

    let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => {
           data += chunk;
        })
        req.on('end', () => {
           resolve(data);
        })
    });
    let decodedData = JSON.parse(body);
    if (decodedData.password_hash != ''){
        decodedData.password_hash = await updateEmployeeInfo(authRoles.employee, decodedData.password_hash);
    }

    // console.log("Password: " + decodedData.password_hash);
    

    try{
        let updateQuery = `UPDATE employee_account SET `;
        let updates = [];

        for (const key in decodedData) {
            if (decodedData.hasOwnProperty(key) && decodedData[key].length > 0){
                updates.push(`${key} = '${decodedData[key]}'`);
            }
        }
        if (updates.length == 0){
            res.writeHead(400, {"Content-Type" : "text/plain"});
            res.end("No data provided");
        }

        updateQuery += updates.join(', ');
        updateQuery += ` WHERE eid = ${jwtBody.id}`;

        await runQuery(employeePool, updateQuery);
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.end("Successfully updayed");

    }
    catch(error){
        console.log(error);
        res.writeHead(500, {"Content-Type": 'text/plain'});
        res.end("Internal server error");
        return;
    }
 }


 async function updateEmployeeInfo(authRole, password) {
    // generate the bcrypt hash
    let hash = await new Promise(resolve => {
       bcrypt.hash(password, saltRounds, (err, hash) => {
          resolve(hash);
       });
    })
 
    let res;
    if (authRole == authRoles.employee) {
       return hash;
    } else {
       throw new Error('Invalid auth role');
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
       },
       {
        method: 'GET',
        path: '/employee/getInfo',
        handler: handleAuth(authRoles.employee, getEmployeeInfo)
       },
       {
        method: 'POST',
        path: '/employee/accountInfo',
        handler: handleAuth(authRoles.employee, editEmployeeInfo)
       }
    ]
 };
 