
import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';
const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];
console.log(cart);

// window.addEventListener('load', populateCartTable("#cart tbody", cart));
// //there would be calls to database here instead
let orders = await initialize();
console.log(orders);
window.addEventListener('load', populateCartTable("#cart tbody", orders));

// Fetch SQL datbase order items
async function initialize() {
     console.log('lol');
     const response = await fetch("/order/getPastOrders", {
        method: "GET",
      });
      const past_orders = await response.json();
      console.log(past_orders);
      return past_orders;
}

