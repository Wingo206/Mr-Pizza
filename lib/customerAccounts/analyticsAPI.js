const { customerPool, runQuery, adminPool, employeePool, authPool, visitorPool,  } = require('../util/database_util');

async function getTotalCompanyRevenue(req, res) {
    try {
        // Collect and parse JSON body from request stream
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
        // Checking if headers have already been sent to handle multiple responses
        if (res.headersSent) {
            console.error('Headers already sent:', err);
            res.end(JSON.stringify({ error: err.message })); // Only end the response if not already ended
        } else {
            console.error('Server error occurred:', err);
            res.writeHead(500, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    }
}

async function getTotalCompanyRevenueByMonth(req, res) {
    try {
        // Corrected logic for getTotalCompanyRevenueByMonth...
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

        // Send success response with the data
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        if (res.headersSent) {
            console.error('Headers already sent:', err);
            res.end(JSON.stringify({ error: err.message })); // Only end the response if not already ended
        } else {
            console.error('Server error occurred:', err);
            res.writeHead(500, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
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
    ]
};
