const { customerPool, runQuery, adminPool, employeePool, authPool, visitorPool,  } = require('../util/database_util');

async function getTotalCompanyRevenue(req, res) {
    try {
         
        let rawData = '';
        req.on('data', chunk => rawData += chunk);
        await new Promise(resolve => req.on('end', resolve));

        let reqBody;
        try {
            reqBody = JSON.parse(rawData);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            res.writeHead(400, {'Content-type': 'application/json'});
            res.end(JSON.stringify({ error: "Invalid JSON input" }));
            return;
        }

        const { startDate, endDate } = reqBody;
        const query = 'SELECT SUM(total_price) AS total_revenue FROM customer_order WHERE DT_CREATED BETWEEN ? AND ?';
        const result = await runQuery(customerPool, query, [startDate, endDate]);
        if (!result || !result.rows || result.rows.length === 0) {
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No data found" }));
            return;
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
    } catch (err) {
        
        if (res.headersSent) {
            console.error('Headers already sent:', err);
            res.end(JSON.stringify({ error: err.message })); 
        } else {
            console.error('Server error occurred:', err);
            res.writeHead(500, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    }
}

async function getTotalCompanyRevenueByMonth(req, res) {
    try {
        
        const { year, month } = req.body;
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

        const query = 'SELECT SUM(total_price) AS total_revenue FROM customer_order WHERE DT_CREATED BETWEEN ? AND ?';
        const result = await runQuery(customerPool, query, [startDate, endDate]);

        if (!result || !result.rows || result.rows.length === 0) {
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No data found for the specified month and year" }));
            return;
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
    } catch (err) {
        if (res.headersSent) {
            console.error('Headers already sent:', err);
            res.end(JSON.stringify({ error: err.message }));
        } else {
            console.error('Server error occurred:', err);
            res.writeHead(500, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
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

        
        if (!result || !result.rows || result.rows.length === 0) {
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No data found" }));
            return;
        }

        
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        
        if (res.headersSent) {
            console.error('Headers already sent:', err);
            res.end(JSON.stringify({ error: err.message })); 
        } else {
            console.error('Server error occurred:', err);
            res.writeHead(500, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    }
}

async function getTotalCustomers(req, res) {
    try {
        const query = 'SELECT COUNT(*) AS numCustomers FROM customer_account';
        const result = await runQuery(customerPool, query);

        if (!result || !result.rows || result.rows.length === 0) {
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No customer data found" }));
            return;
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
    } catch (err) {
        handleError(res, err);
    }
}

async function getTotalEmployees(req, res) {
    try {
        const query = 'SELECT COUNT(*) AS numEmployees FROM employee_account';
        const result = await runQuery(employeePool, query);

        if (!result || !result.rows || result.rows.length === 0) {
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No employee data found" }));
            return;
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
    } catch (err) {
        handleError(res, err);
    }
}

async function getMenuItemsSortedByPopularity(req, res) {
    try {
        const query = `
            SELECT m.description, COUNT(*) AS timesOrdered
            FROM menu_item m
            JOIN order_item oi ON m.mid = oi.mid
            GROUP BY m.description
            ORDER BY timesOrdered DESC`;
        const result = await runQuery(adminPool, query);

        if (!result || !result.rows || result.rows.length === 0) {
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No menu data found" }));
            return;
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        handleError(res, err);
    }
}

async function getRevenueTotalByMenuItem(req, res) {
    try {
        const query = `
            SELECT m.description, SUM(m.price * oi.quantity) AS totalRevenue
            FROM menu_item m
            JOIN order_item oi ON m.mid = oi.mid
            GROUP BY m.description
            ORDER BY totalRevenue DESC`;
        const result = await runQuery(adminPool, query);

        if (!result || !result.rows || result.rows.length === 0) {
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No revenue data found" }));
            return;
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        handleError(res, err);
    }
}

async function getMostPopularToppings(req, res) {
    try {
        const query = `
            SELECT m.description, wc.option_name, COUNT(*) AS timesOrdered
            FROM menu_item m
            JOIN with_custom wc ON wc.mid = m.mid
            WHERE wc.custom_name = 'toppings'
            GROUP BY m.description, wc.option_name
            ORDER BY timesOrdered DESC`;
        const result = await runQuery(adminPool, query);

        if (!result || !result.rows || result.rows.length === 0) {
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No toppings data found" }));
            return;
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        handleError(res, err);
    }
}

async function getEmployeeOrderContribution(req, res) {
    const { storeId } = req.body; // Ensure this is passed correctly in the request body
    try {
        const query = `
            SELECT e.name, COUNT(*) AS orders
            FROM employee_account e
            JOIN made_by mb ON mb.eid = e.eid
            WHERE e.works_at = $1
            GROUP BY e.name
            ORDER BY orders DESC`;
        const result = await runQuery(employeePool, query, [storeId]);

        if (!result || !result.rows || result.rows.length === 0) {
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No order contribution data found" }));
            return;
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        handleError(res, err);
    }
}

async function getDriversMostDeliveries(req, res) {
    const { storeId } = req.body; // Ensure this is passed correctly in the request body
    try {
        const query = `
            SELECT e.name, COUNT(*) AS numDeliveries
            FROM employee_account e
            JOIN delivery_batch db ON db.assignedToEmp = e.eid
            JOIN in_batch ib ON ib.batch_id = db.batch_id
            WHERE e.works_at = $1
            GROUP BY e.name
            ORDER BY numDeliveries DESC`;
        const result = await runQuery(employeePool, query, [storeId]);

        if (!result || !result.rows || result.rows.length === 0) {
            res.writeHead(404, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: "No delivery data found" }));
            return;
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        handleError(res, err);
    }
}




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
    ]
};
