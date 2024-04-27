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
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON format in request body.' }));
        return;
    }

    let decodedOrderId = decodedData.orderId;
    let total = decodedData.total;
    let tipEnabled = decodedData.tip;
    let tip = tipEnabled ? (Math.ceil(total * .15)) : 0;
      
    let lineItems = [];

    if (tipEnabled) {
        lineItems = [
        {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Total Order',
                },
                unit_amount: total * 100,
                tax_behavior: 'inclusive',
            },
            quantity: 1,
        },
        {
        price_data: {
            currency: 'usd',
            product_data: {
            name: '15% Tip - Gratuity',
            },
            unit_amount: tip * 100,
            tax_behavior: 'exclusive',
        },
        quantity: 1,
        }
    ];
    } else {
        lineItems = [
        {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Total Order',
                },
                unit_amount: total * 100,
                tax_behavior: 'inclusive',
            },
            quantity: 1,
        }
    ];}
    try {
        const session = await stripe.checkout.sessions.create({ 
            line_items: lineItems, 
            mode: 'payment', 
            ui_mode: 'embedded', 
            return_url: 'https://127.0.0.1:8080/order/orderStatus.html', //change this to the actual website
            }); 

            await runQuery(customerPool, 'UPDATE customer_order SET stripe_checkout_id  = ?, stripe_payment_intent_id = ? WHERE order_id = ?',[session.id, session.payment_intent, decodedOrderId]);
            console.log("Session ID: ", session.id); 
            console.log("Session Payment Intent: ", session.payment_intent); 
            console.log("Order ID: ", decodedOrderId); 
            console.log("Entire Session: ", session); 
            res.writeHead(200, {'Content-type': 'application/json'}); 
            res.end(JSON.stringify(session)); 
        } 
        catch(error) { 
            console.error("Stripe Checkout Session Creation Error:", error.message);
            res.writeHead(500, {'Content-type': 'application/json'}); 
            res.end(JSON.stringify({ status: 'error', message: 'Internal Server Error: Failed to create Stripe checkout session.' }));
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
            res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON format in request body.' }));
            return;
        }

        let { orderId } = decodedData;
    
        try {
            const result = await runQuery(customerPool, 'SELECT stripe_checkout_id, stripe_payment_intent_id FROM customer_order WHERE order_id = ?', [orderId]);
            if (result.length === 0) {
                res.writeHead(404, {'Content-type': 'application/json'});
                res.end(JSON.stringify({ status: 'error', message: 'Order not found.' }));
                return;
            }
            const updateQuery = 'UPDATE customer_order SET status = "Refunded" WHERE order_id = ?';
            await runQuery(adminPool, updateQuery, [orderId]);
            let query = "UPDATE customer_account SET rewards_points = rewards_points - 1 WHERE cid = " + cusID;
            await runQuery(customerPool, query);

            const stripe_checkout_id = result[0].stripe_checkout_id;
            const session = await stripe.checkout.sessions.retrieve(stripe_checkout_id);
            const payment_intent = session.payment_intent

            const refund = await stripe.refunds.create({
                payment_intent: payment_intent,
            });

            res.writeHead(200, {'Content-type': 'application/json'});
            res.end(JSON.stringify({ status: 'success', refundId: refund.id }));
        } catch (error) {
            console.error("Refund Process Error:", error.message);
            res.writeHead(500, {'Content-type': 'application/json'});
            res.end(JSON.stringify({ status: 'error', message: 'Internal Server Error: Failed to process the refund.' }));
        }
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
        }
    ]
};