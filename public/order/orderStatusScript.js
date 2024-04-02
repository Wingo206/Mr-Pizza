
import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';
const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];
console.log(cart);

await initialize();
let orders = await fillTable();

window.addEventListener('load', displayOrders("#cart tbody", orders));
//add order to database 

function displayOrders(query, orders) {
    const tableBody = document.querySelector(query);

    // Clear the existing table rows
    tableBody.innerHTML = '';

    // Iterate over each order
    orders.forEach(order => {
        // Create a new row for each order
        const row = tableBody.insertRow();

        // Insert the order details into the table cells
        row.insertCell().textContent = order.item_description; // Item
        row.insertCell().textContent = order.item_num; // Quantity WE DONT ACTUALLY STORE QUANTITY
        if (order.item_price == undefined) {
            order.item_price = 0;
        }
        if (order.item_num == undefined) {
            order.item_num = 0;
        }
        row.insertCell().textContent = order.item_price.toFixed(2); // Price per Item
        row.insertCell().textContent = (order.item_num * order.item_price).toFixed(2); // Total Price
    });
}


// window.addEventListener('load', populateCartTable("#cart tbody", cart));
// //there would be calls to database here instead



// Fetch SQL datbase order items
//maybe add proper email when eamiling confirmation would basically have to query 
//from the customer account connected into the database, then when calling email
//send that in the body?? (arya)
//you would also send like a confirmation number and order_id probably
async function initialize() {
     console.log('lol');
     const email = "pewdiepie285@gmail.com";
     const order_id = "2";
     const confirmationCode = "YEISBSU1298";
     let response = await fetch("/order/emailOrderConf", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email , order_id: order_id , confirmationCode: confirmationCode})
      });
     console.log(response);
}

// Fetch SQL datbase order items just ordered
// right now body is hardcoded but should retrieve from last page 
async function fillTable() {
    console.log('lol');
    const requestBody = JSON.stringify({ order_id: 9 });
    const response = await fetch("/order/getOrder", {
       method: "POST",
       headers: {
        "Content-Type": "application/json"
        },
        body: requestBody
     });
     const currentOrder = await response.json();
     console.log(currentOrder);
     return currentOrder;
}

const button1 = document.getElementById("checkMapsButton");

button1.addEventListener("click", function() {
    //make a call to switch paths 
    alert("Going to check delivery/takeout");
});

const button2 = document.getElementById("cancelOrderButton");

button2.addEventListener("click", async function() {
    //make a call to cancel from database and return home 
    alert("Cancel Order and return home");
    let message = await removeOrder();
    //after removing return home 
});

async function removeOrder() {
    console.log('lol');
    const requestBody = JSON.stringify({ order_id: 2 });
    const response = await fetch("/order/cancelOrder", {
       method: "POST",
       headers: {
        "Content-Type": "application/json"
        },
        body: requestBody
     });
     const message = await response.json();
     console.log(message);
     return message;
}
