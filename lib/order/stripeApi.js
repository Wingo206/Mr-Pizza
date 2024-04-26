const mysql = require("mysql2");
const {runQuery, customerPool} = require("../util/database_util");
const stripe = require('stripe')('sk_test_51OxFUuP5gIWmEZ1P9hgubWPghQ2mvA3HyJqF3WaMVW3ToCgRR36u3vyFM5HSSYXXsek5YMFvlzQLRqPePgmOpTJM00WZrpeMKI');

async function setupStripe() {
    const endpoint = await stripe.webhookEndpoints.create({
        url: 'http://example.com',
        enabled_events: [
            'payment_intent.succeeded'
        ],
    });
}

setupStripe();
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

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
     
        mode: 'payment',
        ui_mode: 'embedded',
        return_url: 'https://127.0.0.1:8080/order/orderStatus.html', //change this to the actual website
        });
        
         res.writeHead(200, {'Content-type': 'application/json'});
         res.end(JSON.stringify(session));
    }


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