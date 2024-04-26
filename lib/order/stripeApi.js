const mysql = require("mysql2");
const {runQuery, customerPool} = require("../util/database_util");
const stripe = require('stripe')('sk_test_51OxFUuP5gIWmEZ1P9hgubWPghQ2mvA3HyJqF3WaMVW3ToCgRR36u3vyFM5HSSYXXsek5YMFvlzQLRqPePgmOpTJM00WZrpeMKI');
// const twilio = require('twilio');
// const twilioClient = new twilio('YOUR_TWILIO_SID', 'YOUR_TWILIO_AUTH_TOKEN');

const client_secret = 'sk_test_51OxFUuP5gIWmEZ1P9hgubWPghQ2mvA3HyJqF3WaMVW3ToCgRR36u3vyFM5HSSYXXsek5YMFvlzQLRqPePgmOpTJM00WZrpeMKI';
// Mock cart data
// import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from '../../public/order/orderFunctions.js';
function cartEntry(itemName, quantity, pricePerItem, totalCostOfEntry) {
    this.itemName = itemName;
    this.quantity = quantity;
    this.pricePerItem = pricePerItem;
    this.totalCostOfEntry = totalCostOfEntry;
}
//will need to replace with actual database stuff later
const cartItems = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];

// Example Stripe checkout session creation
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

    let decodedData = JSON.parse(body);
    let decodedOrderId = decodedData.orderId;
    let total = decodedData.total;
    let tipEnabled = decodedData.tip;
    let tip = tipEnabled ? (Math.ceil(total * .15)) : 0;

    // let stripePrice;

    // try {
    //   // Query to retrieve the order details for the specified order_id
    //   const query = `
    //        SELECT co.total_price
    //        FROM customer_order AS co
    //        LEFT JOIN order_item AS oi ON co.order_id = oi.order_id
    //        LEFT JOIN menu_item AS mi ON oi.mid = mi.mid
    //        WHERE co.order_id = ?
    //    `;

    //   stripePrice = await runQuery(customerPool, query, [order_id]);
    //   //console.log(stripePrice);
    
    //   let total = 0.00;
    //   for (let i = 0; i < stripePrice.length; i++) {
    //         total += stripePrice[i].total_price;
    //   }
      //console.log(total);

      
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
        // Tipping option - enabled by default, will need to add a way to disable tipping
        {
      // Tipping option - enabled by default, will need to add a way to disable tipping
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
            return_url: 'https://127.0.0.1:8080/order/orderStatus.html',
            });

            await runQuery(customerPool, 'UPDATE customer_order SET stripe_checkout_id  = ?, stripe_payment_intent_id = ? WHERE order_id = ?', [session.id, session.payment_intent, decodedOrderId]);
            console.log("Session ID: ", session.id);
            console.log("Session Payment Intent: ", session.payment_intent);
            console.log("Order ID: ", decodedOrderId);
            console.log("Entire Session: ", session);
            res.writeHead(200, {'Content-type': 'application/json'});
            res.end(JSON.stringify(session));
        }
        catch(error) {
            console.error("Creation of Stripe Checkout Error:", error.message);
            res.writeHead(500, {'Content-type': 'application/json'});
            res.end(JSON.stringify({ status: 'error', message: error.message }));
        }
        // const orderId = decodedData.orderId;


    // } catch (error) {
    //   console.error("Error:", error.message);
    //   res.writeHead(500, {'Content-type': 'text/plain'});
    //   res.end("Error retrieving total cart price details");
    // } 
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
    
        let { orderId } = JSON.parse(body);
    
        try {
            const result = await runQuery(customerPool, 'SELECT stripe_checkout_id, stripe_payment_intent_id FROM customer_order WHERE order_id = ?', [orderId]);

            console.log("Result is: " + JSON.stringify(result));
            const stripe_checkout_id = result[0].stripe_checkout_id;
            console.log(stripe_checkout_id);
            const session = await stripe.checkout.sessions.retrieve(stripe_checkout_id);
            const payment_intent = session.payment_intent
            console.log(payment_intent);

            const refund = await stripe.refunds.create({
                payment_intent: payment_intent,
            });
    
            res.writeHead(200, {'Content-type': 'application/json'});
            res.end(JSON.stringify({ status: 'success', refundId: refund.id }));
            //console.log("AND I SAY HEY HEY HEY HEY HEY HEY HEY HEY I SAID HEY, WHAT'S GOING ON");
        } catch (error) {
            console.error("Refund Error:", error.message);
            res.writeHead(500, {'Content-type': 'application/json'});
            res.end(JSON.stringify({ status: 'error', message: error.message }));
        }

    }

// // Example order success handler with Twilio notification
// async function handleOrderSuccess(orderId) {
//     // Implement order success logic (e.g., update database)
//     // Send SMS/Email notification via Twilio
//     const message = await twilioClient.messages.create({
//         body: `Your order #${orderId} has been successfully placed!`,
//         to: 'CUSTOMER_PHONE_NUMBER', // Replace with the customer's phone number
//         from: 'YOUR_TWILIO_PHONE_NUMBER', // Replace with your Twilio phone number
//     });
//     console.log(message.sid);
// }

module.exports = {
    routes: [
        // Your existing routes...
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
        // Add more routes as needed for order handling and Twilio notifications
    ]
};