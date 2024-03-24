
import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';
const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];
console.log(cart);

window.addEventListener('load', populateCartTable("#cart tbody", cart));
//there would be calls to database here instead