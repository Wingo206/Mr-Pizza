/* 
 * This is an example front-end script to verify that when
 * an html file is loaded, front-end scripts can be run as well
 */

// make an array or list of somekind where each entry has an item, quantity, price per item, and total per item

function cartEntry(itemName, quantity, pricePerItem, totalCostOfEntry) {
    this.itemName = itemName;
    this.quantity = quantity;
    this.pricePerItem = pricePerItem;
    this.totalCostOfEntry = totalCostOfEntry;
 }

const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];

// const cartDiv = document.getElementById('cartDiv');
// const item1 = document.getElementById('item1');
// const quantity1 = document.getElementById('quantity1');
// const pricePerItem1 = document.getElementById('pricePerItem1');
// const totalPrice1 = document.getElementById('totalPrice1');

// item1.innerHTML = cart[0].itemName;
// quantity1.innerHTML = cart[0].quantity;
// pricePerItem1.innerHTML = cart[0].pricePerItem;
// totalPrice1.innerHTML = cart[0].totalCostOfEntry;

 function calculateTotalCost(cart) {
    let total = 0;
    for (let i = 0; i < cart.length; i++) {
       total += cart[i].totalCostOfEntry;
    }
    return total;
 }

 function displayCart(cart) {
    let showCart = "";
    for (let i = 0; i < cart.length; i++) {
       let entry = cart[i];
       showCart += entry.itemName + " " + entry.quantity + " " + entry.pricePerItem + " " + entry.totalCostOfEntry + "\n";
    }
    return showCart;
 }

 function populateCartTable() {
    const tableBody = document.querySelector('#cart tbody');

    tableBody.innerHTML = '';

    cart.forEach(entry => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = entry.itemName;
        row.insertCell().textContent = entry.quantity;
        row.insertCell().textContent = entry.pricePerItem;
        row.insertCell().textContent = entry.totalCostOfEntry;
    });
 }

 window.addEventListener('load', populateCartTable);

 async function checkoutButtonOnClick() {
    alert("Total cost of cart: " + calculateTotalCost(cart));
 }

console.log("example public script working")
