const mysql = require("mysql2");
const {runQuery, customerPool} = require("../util/database_util");
const stripe = require('stripe')('sk_test_51OxFUuP5gIWmEZ1P9hgubWPghQ2mvA3HyJqF3WaMVW3ToCgRR36u3vyFM5HSSYXXsek5YMFvlzQLRqPePgmOpTJM00WZrpeMKI');
// const twilio = require('twilio');
// const twilioClient = new twilio('YOUR_TWILIO_SID', 'YOUR_TWILIO_AUTH_TOKEN');

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
    let total = decodedData.total;
    let tip = (Math.ceil(total * .15));

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

      const session = await stripe.checkout.sessions.create({
        line_items: [
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
    ],
        
         //payment_intent_data: {
           //  application_fee_amount: 123,
        //     transfer_data: {
        //     destination: 'acct_1OxeMYFpe7jLx4hq',
        //     //acct_1OxFUuP5gIWmEZ1P REAL ONE
        //     //acct_1OxeMYFpe7jLx4hq TEST 
        //     },
         //},
        mode: 'payment',
        ui_mode: 'embedded',
        return_url: 'https://127.0.0.1:8080/order/orderStatus.html', //change this to the actual website
        shipping_address_collection: {
            allowed_countries: ['US', 'CA'],
        },
        // automatic_tax: {enabled: true}
        });
        
         res.writeHead(200, {'Content-type': 'application/json'});
         res.end(JSON.stringify(session));


    // } catch (error) {
    //   console.error("Error:", error.message);
    //   res.writeHead(500, {'Content-type': 'text/plain'});
    //   res.end("Error retrieving total cart price details");
    // } 
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
        }
        // Add more routes as needed for order handling and Twilio notifications
    ]
};