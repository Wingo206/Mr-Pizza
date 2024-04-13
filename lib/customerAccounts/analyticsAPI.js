const { runQuery } = require("../util/database_util.js");

async function getTotalCompanyRevenue(req, res) {
    try {
        const { startDate, endDate } = req.body;
        const query = 'SELECT SUM(total_price) AS total_revenue FROM customer_order WHERE DT_CREATED BETWEEN $1 AND $2';
        const result = await runQuery(query, [startDate, endDate]); // Using parameterized query to prevent SQL injection
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
    } catch (err) {
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

async function getTotalCompanyRevenueByMonth(req, res, year, month) {
    try {
        const startDate = `${year}-${month}-01`; // Start at the first of the month
        const endDate = new Date(year, month, 0).toISOString().slice(0, 10); // Last day of the month

        const query = 'SELECT SUM(total_price) AS total_revenue FROM customer_order WHERE DT_CREATED BETWEEN $1 AND $2';
        const result = await runQuery(query, [startDate, endDate]);
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
    } catch (err) {
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

async function getBestStores(req, res) {
    try {
        const query = `
            SELECT s.address, COUNT(*) AS orderCount
            FROM stores s
            JOIN customer_order o ON o.made_at = s.store_id
            GROUP BY s.address
            ORDER BY orderCount DESC`;
        const result = await runQuery(query);
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

async function getEmployeesPerStore(req, res) {
    try {
        const query = `
            SELECT s.address, COUNT(*) AS numEmployees
            FROM stores s
            JOIN employee_account e ON s.store_id = e.works_at
            GROUP BY s.address`;
        const result = await runQuery(query);
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

async function getTotalCustomers(req, res) {
    try {
        const query = `SELECT COUNT(*) AS numCustomers FROM customer_account`;
        const result = await runQuery(query);
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
    } catch (err) {
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

async function getTotalEmployees(req, res) {
    try {
        const query = `SELECT COUNT(*) AS numEmployees FROM employee_account`;
        const result = await runQuery(query);
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
    } catch (err) {
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

async function getMenuItemsByPopularity(req, res) {
    try {
        const query = `
            SELECT m.description, COUNT(*) AS timesOrdered
            FROM menu_item m
            JOIN order_item oi ON m.mid = oi.mid
            GROUP BY m.description
            ORDER BY timesOrdered DESC`;
        const result = await runQuery(query);
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

