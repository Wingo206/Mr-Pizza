/*
   * First order of business - Make a false cart with a list of items. You can do this by making a list, and displaying it, filling it with items and price
   * Next, start implementing Stripe API. As soon as a customer hits a checkout button with a cart, they will be taken to a new menu. On the left side of the screen, there will be a preview of the items, quantity of items, and price of each item. 
   * On the right side, we will be able to see the Stripe payment menu. It should list the total price, and should have the customer input their information for now. This can be autofilled once an account comes in. If we do it like this, we might need to update System Sequence Diagram Later.
   * After customer pays, we should display a order success or order fail based on payment validation checks (handled by stripe????). 
   * At that moment, the customer will receive a notification through SMS/Email with Twilio API
   * Then, the customer will be automatically redirected to Order Status menu, which will display the order that they just submitted, along with their payment information (censor credit card stuff). Then, we will have buttons to take the to map to see their driver, or a button to take them to the live pizza tracker. They will be placeholders for now.
*/

// example: /example
async function handleOrderApi(req, res) {
   res.writeHead(200, {'Content-type': 'text/plain'});
   res.write('example response')
   res.end();
}

// example: /example/123
async function handleOrderApiWithInput(req, res) {
   let url = req.url;
   let i = url.indexOf('/order/');
   let num = url.slice(i + 9);
   res.writeHead(200, {'Content-type': 'text/plain'});
   res.write('example response with input: ' + num)
   res.end();
}

module.exports = {
   routes: [
      {
         method: 'GET',
         path: '/order',
         handler: handleOrderApi
      },
      {
         method: 'POST',
         path: /^\/order\/[\d]+$/, // starts (^), then "/test/", then 1+ digits ([\d]+), then ends ($)
         handler: handleOrderApiWithInput
      }
   ]
};
