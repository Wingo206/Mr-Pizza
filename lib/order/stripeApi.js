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
const cartItems = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];

// Example Stripe checkout session creation
async function createCheckoutSession(req, res) {
    const session = await stripe.checkout.sessions.create({
    line_items: [
        {
        price_data: {
            currency: 'usd',
            product_data: {
            name: 'T-shirt',
            },
            unit_amount: 2000,
            tax_behavior: 'exclusive',
        },
        quantity: 1,
        },
    ],
    // payment_intent_data: {
    //     application_fee_amount: 123,
    //     transfer_data: {
    //     destination: 'acct_1OxeMYFpe7jLx4hq',
    //     //acct_1OxFUuP5gIWmEZ1P REAL ONE
    //     //acct_1OxeMYFpe7jLx4hq TEST 
    //     },
    // },
    mode: 'payment',
    ui_mode: 'embedded',
    return_url: 'https://testufo.com',
    });
     res.writeHead(200, {'Content-type': 'application/json'});
   res.end(JSON.stringify(session));

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
        // Add more routes as needed for order handling and Twilio notifications
    ]
};