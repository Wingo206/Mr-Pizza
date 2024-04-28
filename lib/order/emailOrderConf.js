const nodemailer = require('nodemailer');
const mysql = require("mysql2");
const {authRoles, handleAuth} = require('../authApi');
const {runQuery, customerPool, adminPool} = require("../util/database_util");


async function sendEmail(req, res, jwtBody) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        port: 587,
        auth: {
        user: 'realmrpizza285@gmail.com',
        pass: 'cmcd hgju nekz drqj'
        },
        secure: false,
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false,
        }
    });

    let order_id;
    let email;

    let cusID = jwtBody.id;

    let recentOrderQuery = "SELECT order_id FROM customer_order WHERE ordered_by = " + cusID + " ORDER BY order_id DESC LIMIT 1";

    let addRewardsQuery = "UPDATE customer_account SET rewards_points = rewards_points + 1 WHERE cid = " + cusID + " AND rewards_points < 5";

    try {
        await runQuery(customerPool, addRewardsQuery);
    } catch (error) {
        console.error("Failed to update rewards points:", error.message);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Internal server error during rewards update"}));
        return;
    }

    let orderToDisplay;
    try {
        orderToDisplay = await runQuery(customerPool, recentOrderQuery);
        if (!orderToDisplay.length) {
            res.writeHead(404, {'Content-type': 'application/json'});
            res.end(JSON.stringify({error: "Order not found"}));
            return;
        }
        order_id = orderToDisplay[0].order_id;
    } catch (error) {
        console.error("Failed to retrieve recent order:", error.message);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Internal server error when fetching order"}));
        return;
    }

    let emailQuery = "SELECT email FROM customer_account WHERE cid = " + cusID;
    let emailAccount;
    try {
        emailAccount = await runQuery(customerPool, emailQuery);
    } catch (error) {
        console.error("Failed to retrieve email:", error.message);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Internal server error when fetching email"}));
        return;
    }
    emailAccount = emailAccount[0].email;
    email = emailAccount;

    let orderInfo;
    try {
        // Query to retrieve the order id from cid
        const query = `
        SELECT co.order_id,
               co.status,
               co.DT_created AS date_created,
               co.total_price,
               co.delivery_address,
               oi.item_num,
               mi.price AS item_price,
               mi.description AS item_description
        FROM customer_order AS co
        LEFT JOIN order_item AS oi ON co.order_id = oi.order_id
        LEFT JOIN menu_item AS mi ON oi.mid = mi.mid
        WHERE co.order_id = ?
        `;
        orderInfo = await runQuery(customerPool, query, [order_id]);
    } catch (error) {
        console.error("Error retrieving order from orderID of customer " + order_id + ".");
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Failed to retrieve order details"}));
        return;
    }

    let output = "Order Details:\n-------------\n";
    let totals = 0;

    orderInfo.forEach(order => {
        totals += order.item_price;
        output += `Item: ${order.item_description}\n`;
        output += `Price per Item: $${order.item_price.toFixed(2)}\n`;
        output += `Total Price: $${(1 * order.item_price).toFixed(2)}\n`;
        output += "-----------------------------------\n";
    });

    output += `Delivery Address: ${orderInfo[0].delivery_address}\n`;

    output += `Total Order Price: $${totals.toFixed(2)}`;

    let text = "Order #" + order_id + " has been placed! \n Your order info below:\n" + output;

    var mailOptions = {
        from: 'realmrpizza285@gmail.com',
        to: email,
        subject: 'Sending Email Confirmation of Pizza Order!',
        text: text
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.writeHead(400, {'Content-type': 'application/json'});
            res.end(JSON.stringify({error: "Failed to send email"}));
        } else {
            console.log('Email sent: ' + info.response);
            res.writeHead(200, {'Content-type': 'text/plain'});
            res.end("Email sent successfully!");
        }
    });

    transporter.close();
}

async function sendCancel(req, res, jwtBody) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        port: 587,
        auth: {
        user: 'realmrpizza285@gmail.com',
        pass: 'cmcd hgju nekz drqj'
        },
        secure: false,
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false,
        }
    });

    let order_id;
    let email;

    let cusID = jwtBody.id;

    let recentOrderQuery = "SELECT order_id FROM customer_order WHERE ordered_by = " + cusID + " ORDER BY order_id DESC LIMIT 1";

    let orderToDisplay;
    try {
        orderToDisplay = await runQuery(customerPool, recentOrderQuery);
        if (!orderToDisplay.length) {
            res.writeHead(404, {'Content-type': 'application/json'});
            res.end(JSON.stringify({error: "Order not found"}));
            return;
        }
        order_id = orderToDisplay[0].order_id;
    } catch (error) {
        console.error("Failed to retrieve recent order:", error.message);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Internal server error when fetching order"}));
        return;
    }

    let emailQuery = "SELECT email FROM customer_account WHERE cid = " + cusID;
    let emailAccount;
    try {
        emailAccount = await runQuery(customerPool, emailQuery);
    } catch (error) {
        console.error("Failed to retrieve email:", error.message);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Internal server error when fetching email"}));
        return;
    }

    emailAccount = emailAccount[0].email;
    email = emailAccount;

    let orderInfo;
    try {
        // Query to retrieve the order id from cid
        const query = `
        SELECT co.order_id,
               co.status,
               co.DT_created AS date_created,
               co.total_price,
               co.delivery_address,
               oi.item_num,
               mi.price AS item_price,
               mi.description AS item_description
        FROM customer_order AS co
        LEFT JOIN order_item AS oi ON co.order_id = oi.order_id
        LEFT JOIN menu_item AS mi ON oi.mid = mi.mid
        WHERE co.order_id = ?
        `;
        orderInfo = await runQuery(customerPool, query, [order_id]);
    } catch (error) {
        console.error("Error retrieving order from orderID of customer " + order_id + ".");
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Failed to retrieve order details"}));
        return;
    }

    let output = "Order Details:\n-------------\n";
    let totals = 0;

    orderInfo.forEach(order => {
        totals += order.item_price;
        output += `Item: ${order.item_description}\n`;
        output += `Price per Item: $${order.item_price.toFixed(2)}\n`;
        output += `Total Price: $${(1 * order.item_price).toFixed(2)}\n`;
        output += "-----------------------------------\n";
    });

    output += `Delivery Address: ${orderInfo[0].delivery_address}\n`;

    output += `Total Order Price: $${totals.toFixed(2)}`;

    let text = "Order #" + order_id + " has been cancelled! \n Your order info below:\n" + output;

    var mailOptions = {
        from: 'realmrpizza285@gmail.com',
        to: email,
        subject: 'Sending Email Cancellation of Pizza Order!',
        text: text
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.writeHead(400, {'Content-type': 'application/json'});
            res.end(JSON.stringify({error: "Failed to send email"}));
        } else {
            console.log('Email sent: ' + info.response);
            res.writeHead(200, {'Content-type': 'text/plain'});
            res.end("Email sent successfully!");
        }
    });

    transporter.close();
}


async function sendRefund(req, res, jwtBody) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        port: 587,
        auth: {
        user: 'realmrpizza285@gmail.com',
        pass: 'cmcd hgju nekz drqj'
        },
        secure: false,
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false,
        }
    });

    let order_id;
    let email;

    let cusID = jwtBody.id;

    let recentOrderQuery = "SELECT order_id FROM customer_order WHERE ordered_by = " + cusID + " ORDER BY order_id DESC LIMIT 1";

    let orderToDisplay;
    try {
        orderToDisplay = await runQuery(customerPool, recentOrderQuery);
        if (!orderToDisplay.length) {
            res.writeHead(404, {'Content-type': 'application/json'});
            res.end(JSON.stringify({error: "Order not found"}));
            return;
        }
        order_id = orderToDisplay[0].order_id;
    } catch (error) {
        console.error("Failed to retrieve recent order:", error.message);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Internal server error when fetching order"}));
        return;
    }

    let emailQuery = "SELECT email FROM customer_account WHERE cid = " + cusID;
    let emailAccount;
    try {
        emailAccount = await runQuery(customerPool, emailQuery);
    } catch (error) {
        console.error("Failed to retrieve email:", error.message);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Internal server error when fetching email"}));
        return;
    }

    emailAccount = emailAccount[0].email;
    email = emailAccount;

    let orderInfo;
    try {
        // Query to retrieve the order id from cid
        const query = `
        SELECT co.order_id,
               co.status,
               co.DT_created AS date_created,
               co.total_price,
               co.delivery_address,
               co.stripe_checkout_id,
               oi.item_num,
               mi.price AS item_price,
               mi.description AS item_description
        FROM customer_order AS co
        LEFT JOIN order_item AS oi ON co.order_id = oi.order_id
        LEFT JOIN menu_item AS mi ON oi.mid = mi.mid
        WHERE co.order_id = ?
        `;
        orderInfo = await runQuery(customerPool, query, [order_id]);
    } catch (error) {
        console.error("Error retrieving order from orderID of customer " + order_id + ".");
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Failed to retrieve order details"}));
        return;
    }

    let output = "Order Details:\n-------------\n";
    let totals = 0;

    orderInfo.forEach(order => {
        totals += order.item_price;
        output += `Item: ${order.item_description}\n`;
        output += `Price per Item: $${order.item_price.toFixed(2)}\n`;
        output += `Total Price: $${(1 * order.item_price).toFixed(2)}\n`;
        output += "-----------------------------------\n";
    });

    output += `Delivery Address: ${orderInfo[0].delivery_address}\n`;
    output += `Stripe Checkout ID: ${orderInfo[0].stripe_checkout_id}\n`;

    output += `Total Order Price: $${totals.toFixed(2)}`;

    let text = "Order #" + order_id + " has been refunded! \n Your order info below:\n" + output;

    var mailOptions = {
        from: 'realmrpizza285@gmail.com',
        to: email,
        subject: 'Sending Email Refund of Pizza Order!',
        text: text
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.writeHead(400, {'Content-type': 'application/json'});
            res.end(JSON.stringify({error: "Failed to send email"}));
        } else {
            console.log('Email sent: ' + info.response);
            res.writeHead(200, {'Content-type': 'text/plain'});
            res.end("Email sent successfully!");
        }
    });

    transporter.close();
}

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/order/emailOrderConf',
            handler: handleAuth(authRoles.customer, sendEmail)
        },
        {
            method: 'POST',
            path: '/order/emailOrderCancel',
            handler: handleAuth(authRoles.customer, sendCancel)
        },
        {
            method: 'POST',
            path: '/order/emailOrderRefund',
            handler: handleAuth(authRoles.customer, sendRefund)
        },
    ]
};