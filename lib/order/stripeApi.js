const nodemailer = require('nodemailer');
const mysql = require("mysql2");
const {runQuery, customerPool, adminPool} = require("../util/database_util");
const stripe = require('stripe')('sk_test_51OxFUuP5gIWmEZ1P9hgubWPghQ2mvA3HyJqF3WaMVW3ToCgRR36u3vyFM5HSSYXXsek5YMFvlzQLRqPePgmOpTJM00WZrpeMKI');

const client_secret = 'sk_test_51OxFUuP5gIWmEZ1P9hgubWPghQ2mvA3HyJqF3WaMVW3ToCgRR36u3vyFM5HSSYXXsek5YMFvlzQLRqPePgmOpTJM00WZrpeMKI';

// Stripe checkout session creation
async function createCheckoutSession(req, res) {

    let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        })
        req.on('end', () => {
            resolve(data);
        })
    });

    let decodedData;
    try {
        decodedData = JSON.parse(body);
    } catch (error) {
        console.error("Error parsing request body:", error.message);
        res.writeHead(400, {'Content-type': 'application/json'});
        res.end(JSON.stringify({status: 'error', message: 'Invalid JSON format in request body.'}));
        return;
    }

    let decodedOrderId = decodedData.orderId;
    let total = (decodedData.total * 100).toFixed(0);
    let tipEnabled = decodedData.tip;
    let tipAmount = tipEnabled ? total * 0.15 : 0;
    let tip = (tipAmount).toFixed(0);
    let name = 'Total Order';

    if (tipEnabled) {
        console.log(total);
        let tempTotal = parseFloat(total) + parseFloat(tip); 
        total = tempTotal.toFixed(0);
        console.log(total);
        name = 'Total Order + 15% Tip';
    }
    let lineItems = [];

    lineItems = [
        {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: name,
                },
                unit_amount: total,
                tax_behavior: 'inclusive',
            },
            quantity: 1,
        }
    ];
   
    try {
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            ui_mode: 'embedded',
            return_url: 'https://127.0.0.1:8080/order/orderStatus.html', //change this to the actual website
        });

        await runQuery(customerPool, 'UPDATE customer_order SET stripe_checkout_id  = ?, stripe_payment_intent_id = ? WHERE order_id = ?', [session.id, session.payment_intent, decodedOrderId]);
        console.log("Session ID: ", session.id);
        console.log("Session Payment Intent: ", session.payment_intent);
        console.log("Order ID: ", decodedOrderId);
        console.log("Entire Session: ", session);
        res.writeHead(200, {'Content-type': 'application/json'});
        res.end(JSON.stringify(session));
    }
    catch (error) {
        console.error("Stripe Checkout Session Creation Error:", error.message);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({status: 'error', message: 'Internal Server Error: Failed to create Stripe checkout session.'}));
    }
}

async function handleRefund(req, res) {
    let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            resolve(data);
        });
    });

    let decodedData;
    try {
        decodedData = JSON.parse(body);
    } catch (error) {
        console.error("Error parsing request body:", error.message);
        res.writeHead(400, {'Content-type': 'application/json'});
        res.end(JSON.stringify({status: 'error', message: 'Invalid JSON format in request body.'}));
        return;
    }

    let {orderId} = decodedData;

    try {
        const result = await runQuery(customerPool, 'SELECT stripe_checkout_id, stripe_payment_intent_id FROM customer_order WHERE order_id = ?', [orderId]);
        if (result.length === 0) {
            res.writeHead(404, {'Content-type': 'application/json'});
            res.end(JSON.stringify({status: 'error', message: 'Order not found.'}));
            return;
        }
        const updateQuery = 'UPDATE customer_order SET status = "Refunded" WHERE order_id = ?';
        await runQuery(adminPool, updateQuery, [orderId]);


        let checkTotalQuery = "SELECT total_price FROM customer_order WHERE order_id = " + orderId;
        let checker;
    
        try {
            checker = await runQuery(customerPool, checkTotalQuery);
        } catch (error) {
            console.error("Failed to update rewards points:", error.message);
            res.writeHead(500, {'Content-type': 'application/json'});
            res.end(JSON.stringify({error: "Internal server error during rewards update"}));
            return;
        }
        
        let orderTotal = checker[0].total_price;
    
        if(orderTotal >= 5) {
            let getCidQuery = "SELECT ordered_by FROM customer_order WHERE order_id = " + orderId;

            let cus = await runQuery(customerPool, getCidQuery);
            console.log(cus);
            let customerID = cus[0].ordered_by;

            let query = "UPDATE customer_account SET rewards_points = rewards_points - 1 WHERE cid = " + customerID;
            await runQuery(customerPool, query);
        }
    

        const stripe_checkout_id = result[0].stripe_checkout_id;
        const session = await stripe.checkout.sessions.retrieve(stripe_checkout_id);
        const payment_intent = session.payment_intent

        const refund = await stripe.refunds.create({
            payment_intent: payment_intent,
        });

        res.writeHead(200, {'Content-type': 'application/json'});
        res.end(JSON.stringify({status: 'success', refundId: refund.id}));
    } catch (error) {
        console.error("Refund Process Error:", error.message);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({status: 'error', message: 'Internal Server Error: Failed to process the refund.'}));
    }
}

/**
 * Webhook for stripe to call when there are payment events
 */
async function stripeConfirmation(req, res) {
    console.log("Beginning Stripe Confirmation");
    let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        })
        req.on('end', () => {
            resolve(data);
        })
    });

    let decodedData;
    try {
        decodedData = JSON.parse(body);
        //console.log(decodedData);
        // make sure the type of event is a session completion
        if (!decodedData.hasOwnProperty('type')) {
            res.writeHead(400, {'Content-type': 'text/plain'});
            res.end("Bad Request: Invalid Stripe Event.");
            return;
        }
        if (decodedData.type != 'checkout.session.completed') {
            res.writeHead(200, {'Content-type': 'text/plain'});
            res.end("Success, but session has not been completed.");
            return;
        }
        // update the entry in the database with the id from the event
        let checkoutId = decodedData.data.object.id;
        console.log(checkoutId);
        let result = await runQuery(adminPool,
            `UPDATE customer_order SET status = "Paid" WHERE stripe_checkout_id = ?`,
            checkoutId) // TODO change this to the proper status
        //console.log(result)

        await sendEmailConf({checkoutId: checkoutId});

        res.writeHead(200, {'Content-type': 'application/json'});
        res.end("Stripe confirmation successful.");
    } catch (error) {
        console.error("Error parsing JSON:", error);
        res.writeHead(400, {'Content-type': 'text/plain'});
        res.write("Bad Request: Invalid JSON data received.");
        res.end();
    }

    //console.log(decodedData);
}

async function sendEmailConf(req, res) {
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

    console.log("IN EMAIL " + req);
    let checkoutId = req.checkoutId;

    let order_id;
    let email;

    console.log(checkoutId);
    let recentOrderQuery = "SELECT order_id FROM customer_order WHERE stripe_checkout_id = ?";
    //let recentOrderQuery = "SELECT order_id FROM customer_order WHERE ordered_by = 4";

    let orderToDisplay;
    try {
        orderToDisplay = await runQuery(customerPool, recentOrderQuery, checkoutId);
        console.log(orderToDisplay);
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

    let getCidQuery = "SELECT ordered_by FROM customer_order WHERE order_id = " + order_id;

    let cus = await runQuery(customerPool, getCidQuery);
    console.log(cus);
    let customerID = cus[0].ordered_by;
    console.log(customerID);

    let checkTotalQuery = "SELECT total_price FROM customer_order WHERE order_id = " + order_id;
    let checker;

    try {
        checker = await runQuery(customerPool, checkTotalQuery);
    } catch (error) {
        console.error("Failed to update rewards points:", error.message);
        res.writeHead(500, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Internal server error during rewards update"}));
        return;
    }
    
    let orderTotal = checker[0].total_price;
    console.log("ORDERTTOTAL " + orderTotal);

    if(orderTotal >= 5) {
        let addRewardsQuery = "UPDATE customer_account SET rewards_points = rewards_points + 1 WHERE cid = " + customerID;

        try {
            await runQuery(customerPool, addRewardsQuery);
        } catch (error) {
            console.error("Failed to update rewards points:", error.message);
            res.writeHead(500, {'Content-type': 'application/json'});
            res.end(JSON.stringify({error: "Internal server error during rewards update"}));
            return;
        }
    }

    let emailQuery = "SELECT email FROM customer_account WHERE cid = " + customerID;
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
               mi.item_name AS item_description
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


module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/order/createCheckoutSession',
            handler: createCheckoutSession
        },
        {
            method: 'POST',
            path: '/order/handleRefund',
            handler: handleRefund
        },
        {
            method: "POST",
            path: '/order/stripeWebhook',
            handler: stripeConfirmation
        }
    ]
};
