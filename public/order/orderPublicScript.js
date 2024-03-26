/* 
 * This is an example front-end script to verify that when
 * an html file is loaded, front-end scripts can be run as well
 */

import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';
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

const orderData = [
  {
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
      price: 9.99,
      image_url: 'https://example.com/image1.jpg',
      description: 'Pizza Margherita'
  }
];

const orderItemData = [
  { order_id: 0, mid: 1 }
];

const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];
const stripe = Stripe('pk_test_51OxFUuP5gIWmEZ1PniORZnxF5lBrVHSaZzQeI836MWHDsr2cjqRsiFOoolY5yP9zQse5Sar1T0s0hwpy6QwKbfhX00MVSoX1UQ')
console.log(cart);

//replace conditionals with checking if user is employee or admin,
//for video just replace it to show customer and employee or admin 
if (true) {
  document.getElementById("pastOrderButton").removeAttribute("hidden");
}
else {
  document.getElementById("pastOrderButton").setAttribute("hidden", "hidden");
}

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
  const order = orderData[0];
  const menuItem = menuItemData[0];
  const orderItem = orderItemData[0];

  const row = tableBody.insertRow();
  row.insertCell().textContent = capitalizeFirstLetter(menuItem.description);
  row.insertCell().textContent = 1; // Assuming you have a quantity field in orderItemData
  row.insertCell().textContent = menuItem.price;
  row.insertCell().textContent = order.total_price;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

 window.addEventListener('load', newCartTable("#cart tbody", orderData, menuItemData, orderItemData));

 async function checkoutButtonOnClick() {
    alert("Total cost of cart: " + calculateTotalCost(cart));
 }

initialize();

// Fetch Checkout Session and retrieve the client secret
async function initialize() {
  const fetchClientSecret = async () => {
   console.log('lol');
   const response = await fetch("/order/createCheckoutSession", {
      method: "POST",
    });
    const { client_secret } = await response.json();
    return client_secret;
  };

  // Initialize Checkout
  const checkout = await stripe.initEmbeddedCheckout({
    fetchClientSecret,
  });

  // Mount Checkout
  checkout.mount('#checkout');
}

const button1 = document.getElementById("checkoutButton");

button1.addEventListener("click", function() {
  
      const fetchReponse = async () => {
        console.log('lol');
       
        const response = await fetch("/order/postOrder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json" // Specify the content type as JSON
          },
          body: JSON.stringify({ orderData, menuItemData, orderItemData })
        });
        const responseData = await response.json();
        alert(JSON.stringify(responseData));

      }

      fetchReponse(); 
});

