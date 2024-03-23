const {customerPool, runQuery} = require("../database_util.js");

async function getCustomerAccounts(req, res) {
    let customerAccounts = await runQuery(customerPool, "SELECT * FROM customer_account");
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify(customerAccounts));
    res.end();
}

async function getCustomerAccountById(req, res) {
    let url = req.url;
    let i = url.indexOf('/customerAccounts/');
    let cid = url.slice(i + 18);
    console.log(cid);
    let query = `SELECT * FROM customer_account WHERE cid = '${cid}'`; 
    let customerAccount = await runQuery(customerPool, query);  
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify(customerAccount));
    res.end();
}

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/customerAccounts',
            handler: getCustomerAccounts
        },
        {
            method: 'GET',
            path: /^\/customerAccounts\/[\d]+$/,
            handler: getCustomerAccountById
        }
    ]
};