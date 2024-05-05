const { customerPool, runQuery, adminPool, employeePool, dateToDb} = require('../util/database_util');
const {getJSONBody} = require("../util/inputValidationUtil");


async function getTotalCompanyRevenue(req, res) {
    try {
        const reqBody = await getJSONBody(req, res, ['startDate', 'endDate']);
        if (!reqBody) return; // Exit if JSON body validation fails

        const { startDate, endDate } = reqBody;
        // Ensuring dates are converted to the correct format for database querying
        const formattedStartDate = new Date(startDate).toISOString().slice(0, 19).replace('T', ' ');
        const formattedEndDate = new Date(endDate).toISOString().slice(0, 19).replace('T', ' ');

        const query = 'SELECT IFNULL(SUM(total_price), 0) AS total_revenue FROM customer_order WHERE DT_CREATED BETWEEN ? AND ?';
        console.log('Executing query:', query);
        console.log('With dates:', formattedStartDate, formattedEndDate);

        const result = await runQuery(customerPool, query, [formattedStartDate, formattedEndDate]);

        console.log('Query result:', result); // Log the raw result for debugging

        if (result && result.length > 0) {
            const totalRevenue = result[0].total_revenue;
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ total_revenue: totalRevenue }));
        } else {
            console.error('No data found or unexpected query result:', result);
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No data found for the specified date range" }));
        }
    } catch (err) {
        console.error('Error in getTotalCompanyRevenue:', err);
        handleError(res, err);
    }
}


async function getTotalCompanyRevenueByMonth(req, res) {
    try {
        const reqBody = await getJSONBody(req, res, ['year', 'month']);
        if (!reqBody) return;  // Exit if JSON body validation fails

        // Ensuring year and month are integers and correctly bounded
        const year = parseInt(reqBody.year, 10);
        const month = parseInt(reqBody.month, 10);

        // Handling invalid year or month inputs
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            res.writeHead(400, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "Invalid year or month provided" }));
            return;
        }

        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().slice(0, 10);  // Correctly calculating the last day of the month

        const query = 'SELECT IFNULL(SUM(total_price), 0) AS total_revenue FROM customer_order WHERE DT_CREATED BETWEEN ? AND ?';
        console.log('Executing query:', query);
        console.log('Date range:', startDate, 'to', endDate);

        const result = await runQuery(customerPool, query, [startDate, endDate]);

        console.log('Query result:', result); // Log the raw result for debugging

        // Result validation and response
        if (result && result.length > 0 && result[0].total_revenue !== null) {
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ total_revenue: result[0].total_revenue }));
        } else {
            // Ensuring consistent response structure even when no data is found
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ total_revenue: 0, message: "No data found for the specified month and year" }));
        }
    } catch (err) {
        console.error('Error in getTotalCompanyRevenueByMonth:', err);
        handleError(res, err);
    }
}


async function getEmployeeCountByStore(req, res) {
    try {
        const query = `
            SELECT s.address, COUNT(e.eid) AS numEmployees
            FROM store s
            LEFT JOIN employee_account e ON s.store_id = e.works_at
            GROUP BY s.store_id, s.address;
        `;
        const result = await runQuery(adminPool, query);
        console.log('Query Result:', result);  // Log the raw result to see what's actually returned

        // Check if the result contains data and if the data array has entries
        if (result && result.length > 0) {
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify(result));
        } else if (result && result.length === 0) {
            console.log('No employees found for any stores');
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No employee data found for any store" }));
        } else {
            console.error('Unexpected error accessing database');
            res.writeHead(500, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal server error accessing employee data" }));
        }
    } catch (err) {
        console.error('Exception caught in getEmployeeCountByStore:', err);
        handleError(res, err);
    }
}


async function getTotalCustomers(req, res) {
    try {
        const query = 'SELECT COUNT(*) AS numCustomers FROM customer_account';
        const result = await runQuery(customerPool, query);

        console.log('Query Result:', result);  // Log to verify the structure

        // Check if the result array is present and has at least one entry
        if (result && result.length > 0 && result[0].numCustomers !== undefined) {
            const numCustomers = result[0].numCustomers; // Accessing the first element directly
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ numCustomers }));
        } else {
            // Log unexpected results for further investigation
            console.error('Unexpected result structure or no result from database', result);
            res.writeHead(500, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal server error. Unable to fetch customer data." }));
        }
    } catch (err) {
        console.error('Exception caught in getTotalCustomers:', err);
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: "Internal server error. Error details: " + err.message }));
    }
}


async function getTotalEmployees(req, res) {
    try {
        const query = 'SELECT COUNT(*) AS numEmployees FROM employee_account';
        const result = await runQuery(employeePool, query);

        console.log('Query Result:', result);  

        if (result && result.length > 0 && result[0].numEmployees !== undefined) {
            const numEmployees = result[0].numEmployees; 
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ numEmployees }));
        } else {
            console.error('Unexpected result structure or no result from database', result);
            res.writeHead(500, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal server error. Unable to fetch employee data." }));
        }
    } catch (err) {
        console.error('Exception caught in getTotalEmployees:', err);
        handleError(res, err);
    }
}


async function getMenuItemsSortedByPopularity(req, res) {
    try {
        const query = `
            SELECT m.item_name, COUNT(*) AS timesOrdered
            FROM menu_item m
            JOIN order_item oi ON m.mid = oi.mid
            GROUP BY m.item_name
            ORDER BY timesOrdered DESC`;
        const result = await runQuery(adminPool, query);

        console.log('Query Result:', result);  

        
        if (result && result.length > 0) {
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify(result));
        } else {
            
            console.error('Unexpected result structure or no result from database', result);
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No menu data found" }));
        }
    } catch (err) {
        console.error('Exception caught in getMenuItemsSortedByPopularity:', err);
        handleError(res, err);
    }
}


async function getRevenueTotalByMenuItem(req, res) {
    try {
        const query = `
            SELECT m.item_name, SUM(m.price) AS totalRevenue
            FROM menu_item m
            JOIN order_item oi ON m.mid = oi.mid
            GROUP BY m.item_name
            ORDER BY totalRevenue DESC`;
        const result = await runQuery(adminPool, query);

        console.log('Query Result:', result);  // Log the raw result for debugging

        // Check if the result array is present and has at least one entry
        if (result && result.length > 0) {
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify(result)); // result is directly an array of objects
        } else {
            console.error('Unexpected result structure or no result from database:', result);
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No revenue data found" }));
        }
    } catch (err) {
        console.error('Exception caught in getRevenueTotalByMenuItem:', err);
        handleError(res, err);
    }
}



async function getMostPopularToppings(req, res) {
    try {
        const query = `
            SELECT m.item_name, wc.option_name, COUNT(*) AS timesOrdered
            FROM menu_item m
            JOIN with_custom wc ON wc.mid = m.mid
            WHERE wc.custom_name = 'toppings'
            GROUP BY m.item_name, wc.option_name
            ORDER BY timesOrdered DESC`;
        const result = await runQuery(adminPool, query);

        console.log('Query Result:', result);  // Log the raw result for debugging

        // Check if the result array is present and has at least one entry
        if (result && result.length > 0) {
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify(result)); // result is directly an array of objects
        } else {
            console.error('Unexpected result structure or no result from database:', result);
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No toppings data found" }));
        }
    } catch (err) {
        console.error('Exception caught in getMostPopularToppings:', err);
        handleError(res, err);
    }
}

/*
async function getEmployeeOrderContribution(req, res) {
    try {
        const reqBody = await getJSONBody(req, res, ['storeId']);
        if (!reqBody) return; 

        const { storeId } = reqBody;
        console.log('Requested Store ID:', storeId); 

        const numericStoreId = parseInt(storeId, 10);

        const query = `
            SELECT e.name, COUNT(*) AS orders
            FROM employee_account e
            JOIN made_by mb ON mb.eid = e.eid
            JOIN customer_order co ON mb.order_id = co.order_id
            WHERE e.works_at = ? AND e.employee_type != 'admin'
            GROUP BY e.eid, e.name
            ORDER BY orders DESC`;

        // Execute the query
        const result = await runQuery(employeePool, query, [numericStoreId]);

        console.log('Query Result:', result); // Log the query result for debugging

        if (result && result.length > 0) {
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify(result));
        } else {
            console.error('No order contribution data found for store:', numericStoreId);
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No order contribution data found for the specified store" }));
        }
    } catch (err) {
        console.error('Exception caught in getEmployeeOrderContribution:', err);
        handleError(res, err);
    }
}

*/



/*
async function getDriversMostDeliveries(req, res) {
    try {
        const reqBody = await getJSONBody(req, res, ['storeId']);
        if (!reqBody) return;

        const { storeId } = reqBody;
        const query = `
            SELECT e.name, COUNT(*) AS numDeliveries
            FROM employee_account e
            JOIN delivery_batch db ON db.assignedToEmp = e.eid
            JOIN in_batch ib ON ib.batch_id = db.batch_id
            WHERE e.works_at = ?
            GROUP BY e.name
            ORDER BY numDeliveries DESC`;
        const result = await runQuery(employeePool, query, [storeId]);

        if (result && result.length > 0) {
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify(result));
        } else {
            console.log(`No deliveries found for storeId: ${storeId}`);
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No delivery data found for the specified store" }));
        }
    } catch (err) {
        console.error('Exception caught in getDriversMostDeliveries:', err);
        handleError(res, err);
    }
}
*/

function handleError(res, err) {
    if (res.headersSent) {
        console.error('Headers already sent:', err);
        res.end(JSON.stringify({ error: err.message }));
    } else {
        console.error('Server error occurred:', err);
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}


module.exports = {
    routes: [
        {
            method: 'POST',
            path: /^\/getTotalCompanyRevenue$/,
            handler: getTotalCompanyRevenue
        },
        {
            method: 'POST',
            path: /^\/getTotalCompanyRevenueByMonth$/,
            handler: getTotalCompanyRevenueByMonth
        },
        {
            method: 'GET',
            path: /^\/getEmployeeCountByStore$/,
            handler: getEmployeeCountByStore
        },
        {
            method: 'GET',
            path: /^\/getTotalCustomers$/,
            handler: getTotalCustomers
        },
        {
            method: 'GET',
            path: /^\/getTotalEmployees$/,
            handler: getTotalEmployees
        },
        {
            method: 'GET',
            path: /^\/getMenuItemsSortedByPopularity$/,
            handler: getMenuItemsSortedByPopularity
        },
        {
            method: 'GET',
            path: /^\/getRevenueTotalByMenuItem$/,
            handler: getRevenueTotalByMenuItem
        },
        {
            method: 'GET',
            path: /^\/getMostPopularToppings$/,
            handler: getMostPopularToppings
        },
        
    ]
};
