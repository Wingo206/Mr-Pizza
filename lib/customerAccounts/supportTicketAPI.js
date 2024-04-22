const { handleAuth, authRoles } = require("../authApi.js");
const { customerPool, employeePool, runQuery } = require("../util/database_util.js");

// Endpoint handler for customers to create a support ticket
async function createSupportTicket(req, res, jwtBody) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString(); // Convert Buffer to string
    });
    req.on('end', async () => {
        try {
            const { description } = JSON.parse(body);

            // Validate if all required fields are present
            if (!description) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                res.end("Description is a required field.");
                return;
            }

            // Insert the support ticket into the database
            const insertQuery = `INSERT INTO help_ticket (asked_by, question) VALUES (?, ?)`;
            await runQuery(customerPool, insertQuery, [jwtBody.id, description]);

            res.writeHead(201, { "Content-Type": "text/plain" });
            res.end("Support ticket created successfully.");
        } catch (error) {
            console.error(error);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal server error.");
        }
    });
}

// Endpoint handler for employees to respond to support tickets
async function respondToSupportTicket(req, res, jwtBody) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', async () => {
        try {
            const { ticketId, response } = JSON.parse(body);
            
            // Validate if all required fields are present
            if (!ticketId || !response) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                res.end("Ticket ID and response are required fields.");
                return;
            }

            // Update the support ticket with the employee's response
            const updateQuery = `UPDATE help_ticket SET response = "${response}", employee_id = ${jwtBody.id} WHERE id = ${ticketId}`;
            await runQuery(employeePool, updateQuery);

            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Response added to support ticket successfully.");
        } catch (error) {
            console.error(error);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal server error.");
        }
    });
}

// Endpoint handler to fetch support tickets for employees
async function getSupportTickets(req, res, jwtBody) {
    try {
        // Query the database for support tickets
        const query = `SELECT * FROM help_ticket`;
        const tickets = await runQuery(employeePool, query);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tickets));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal server error.");
    }
}

// Endpoint handler to fetch past support tickets
async function getPastTickets(req, res, jwtBody) {
    try {
        // Query the database for support tickets belonging to the authenticated customer
        const query = `SELECT tid AS id, question AS description, answer AS response FROM help_ticket WHERE asked_by = ?`;
        const tickets = await runQuery(customerPool, query, [jwtBody.id]);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tickets));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal server error.");
    }
}

module.exports = {
    routes: [
        {
            method: "POST",
            path: "/support/createTicket",
            handler: handleAuth(authRoles.customer, createSupportTicket)
        },
        {
            method: "POST",
            path: "/support/respondToTicket",
            handler: handleAuth(authRoles.employee, respondToSupportTicket)
        },
        {
            method: "GET",
            path: "/support/tickets",
            handler: handleAuth(authRoles.employee, getSupportTickets)
        },
        {
            method: "GET",
            path: "/support/pastTickets",
            handler: handleAuth(authRoles.customer, getPastTickets)
        }        
    ]
};