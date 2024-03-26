/* 
 * This is an example front-end script to verify that when
 * an html file is loaded, front-end scripts can be run as well
 */

import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';
const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];
const stripe = Stripe('pk_test_51OxFUuP5gIWmEZ1PniORZnxF5lBrVHSaZzQeI836MWHDsr2cjqRsiFOoolY5yP9zQse5Sar1T0s0hwpy6QwKbfhX00MVSoX1UQ')
console.log(cart);

//replace conditionals with checking if user is employee or admin,
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

 window.addEventListener('load', populateCartTable("#cart tbody", cart));

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
