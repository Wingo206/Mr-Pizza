/* 
 * This is an example front-end script to verify that when
 * an html file is loaded, front-end scripts can be run as well
 */

/*
To Do
For Order Page
-Get items from the cart (from menu team) //WILL BE DONE WHEN CART IS FIXED 
-Make sure that stripe total cost is being retrieved from cart
-Make sure only customers can make orders
-Combine stripe checkout with the page checkout button 
-Add option to add rewards (will subtract from total)

For Order Status
-Show contents of order
-Fix orderid increments
-The quantity needs to be fixed, read how many items there are then update quantity
-The table should display the current order's order id
-Link check delivery takeout to map page 
-Check When the Order Status is updated (loop/continously check) Reload the page if status changes
-make cancel order use runquery instead of new connection (and refund functionality)
-Show PP earned and total PP
-email fix for confirmation order

For Past Order
Make status a button or drop down
For table, have the rows be order id, then split the rows further for each small item
Make status update in database
*/

import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';

document.addEventListener('DOMContentLoaded', function() {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const cartEntries = cartItems.map(item => new cartEntry(
    item.description, item.quantity, item.price, item.price * item.quantity
  ));

  let realItems = [];
  for (const entry of cartEntries) {
    realItems.push(entry.itemName);
  }

  console.log("Real Items: " + JSON.stringify(realItems)); // Logging realItems array

  populateCartTable('#cart tbody', cartEntries);
  const totalCost = calculateTotalCost(cartEntries);
  console.log('Total cost:', totalCost);
});


// here instead of making the cart basically we would get it from a request body from the menu team
// so they click a button then run some async function like this, which sends the cart, and we will parse it and go to this path 
// ill put pseudo below

//so this will be in the cart code
// const button1 = document.getElementById("go to checkout");

// button1.addEventListener("click", function() {
//   
// const fetchCart = async () => {
//   console.log('lol');
//   const response = await fetch("/order/goToCheckout", {
//     method: "POST",
//   });
//     alert("in checkout now");
// });

//next code will be some backend js file referencing that path 
// async function sendCart(req, res) {

//   let body = await new Promise(resolve => {
//       let data = '';
//       req.on('data', chunk => {
//           data += chunk;
//       })
//       req.on('end', () => {
//           resolve(data);
//       })
//   });

//   //let decodedData = JSON.parse(body);

//   res.writeHead(200, {'Content-type': 'text/plain'});
//   res.end(decodedData);
//THAT WOULD BE THE CART
// }
// module.exports = {
//   routes: [
//       {
//           method: 'POST',
//           path: '/order/goToCheckout',
//           handler: sendCart
//       },
//   ]
// };

//Then in this code we would basically retrieve it somehow 

//We wouldn't have the credit card and stuff so maybe we have to edit the order after the checkout, maybe a new route or a new query to the database 
//same for made at, or well it needs to update when the status changes REMEMBER 
const orderData = [
  {
    made_at: 1,
    credit_card: '1234567890123456',
    status: 'Processing',
    total_price: 9.99,
    delivery_address: '123 Main St, City, Country',
    DT_created: '2024-03-25 10:00:00',
    DT_delivered: null,
    ordered_by: 1
  }
];

const menuItemData = [
  {
    price : 9.99,
    image_url: 'https://example.com/image1.jpg',
    description: 'Pizza Margherita'
  },
  {
    price: 9.99,
    image_url: 'https://example.com/image2.jpg',
    description: 'Cheese Pizza'
  }
];

const orderItemData = [
  {order_id: 0, mid: 1},
  {order_id: 0, mid: 2},
  {order_id: 0, mid: 2},
];

let total = 0;
for (let i = 0; i < orderItemData.length; i++) {
  total += menuItemData[orderItemData[i].mid - 1].price; 
}

const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];
const stripe = Stripe('pk_test_51OxFUuP5gIWmEZ1PniORZnxF5lBrVHSaZzQeI836MWHDsr2cjqRsiFOoolY5yP9zQse5Sar1T0s0hwpy6QwKbfhX00MVSoX1UQ')
let isThereTip = false;
const button1 = document.getElementById("checkoutButton");
const button2 = document.getElementById("tipButton");
//console.log(cart);

// //replace conditionals with checking if user is employee or admin,
// //for video just replace it to show customer and employee or admin 
// if (true) {
//   document.getElementById("pastOrderButton").removeAttribute("hidden");
// }
// else {
//   document.getElementById("pastOrderButton").setAttribute("hidden", "hidden");
// }

// const cartDiv = document.getElementById('cartDiv');
// const item1 = document.getElementById('item1');
// const quantity1 = document.getElementById('quantity1');
// const pricePerItem1 = document.getElementById('pricePerItem1');
// const totalPrice1 = document.getElementById('totalPrice1');

// item1.innerHTML = cart[0].itemName;
// quantity1.innerHTML = cart[0].quantity;
// pricePerItem1.innerHTML = cart[0].pricePerItem;
// totalPrice1.innerHTML = cart[0].totalCostOfEntry;

function newCartTable(query, orderData, menuItemData, orderItemData) {
  const tableBody = document.querySelector(query);
  tableBody.innerHTML = '';

  // Assuming there's only one item in the cart
  for (let i = 0; i < orderItemData.length; i++) {
    const order = orderData[0];
    const orderItem = orderItemData[i];
    const menuItem = menuItemData[orderItem.mid-1];

  
    const row = tableBody.insertRow();
    row.insertCell().textContent = capitalizeFirstLetter(menuItem.description);
    row.insertCell().textContent = 1; // Assuming you have a quantity field in orderItemData
    row.insertCell().textContent = menuItem.price;
    row.insertCell().textContent = order.total_price;
  }
  
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

window.addEventListener('load', newCartTable("#cart tbody", orderData, menuItemData, orderItemData));

async function checkoutButtonOnClick() {
  alert("Total cost of cart: " + calculateTotalCost(cart));
}

// initialize();

// // Fetch Checkout Session and retrieve the client secret
// async function initialize() {
//   const fetchClientSecret = async () => {
//     const response = await fetch("/order/createCheckoutSession", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json" // Specify the content type as JSON
//       },
//       body: JSON.stringify({ total : total , tip : isThereTip}) 
//     });
//     const {client_secret} = await response.json();
//     return client_secret;
//   };

//   // Initialize Checkout
//   const checkout = await stripe.initEmbeddedCheckout({
//     fetchClientSecret,
//   });

//   // Mount Checkout
//   checkout.mount('#checkout');
// }


button2.addEventListener("click", function () {
  //document.getElementById("tip").removeAttribute("hidden");
  isThereTip = true;
  initializeCheckout(); // Reinitialize checkout whenever tip is toggled
  alert("Tip added");
});

button1.addEventListener("click", function () {

    document.getElementById("checkout").removeAttribute("hidden");
    initializeCheckout();
    //if statement that checks if the time is within 9 am to 4:30 am, if it isnt then print we are closed, please order during opening hours and 30 minutes before the store closes
    
    // let currentTime = new Date();
    // if(currentTime.getHours() < 9 || currentTime.getHours() > 17){
    //   alert("We are closed, please order during within operating hours 9 AM to 5 PM. Please place your order 30 minutes before closing time");
    //   return;
    // }

    const fetchReponse = async () => {
      const response = await fetch("/order/postOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json" // Specify the content type as JSON
        },
        body: JSON.stringify({orderData, menuItemData, orderItemData})
      });
      const responseData = await response.text();
      alert(JSON.stringify(responseData));
      
    }
  
    fetchReponse();
  
});

async function initializeCheckout() {
  const clientSecret = await fetchClientSecret();
  const checkout = await stripe.initEmbeddedCheckout({
    clientSecret,
  });

  checkout.mount('#checkout');
}

async function fetchClientSecret() {
  const response = await fetch("/order/createCheckoutSession", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ total: total, tip: isThereTip })
  });
  const { client_secret } = await response.json();
  return client_secret;
}