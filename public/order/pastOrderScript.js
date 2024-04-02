
import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';
const mysql = require("mysql2");
const {runQuery, customerPool} = require("../util/database_util");
// const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];
// console.log(cart);
let statusUpdated = new Array();

// window.addEventListener('load', populateCartTable("#cart tbody", cart));
// //there would be calls to database here instead
let orders = await initialize();
// console.log(orders);
window.addEventListener('load', displayOrders("#cart tbody", orders));

// function displayOrders(query, orders) {
//   const tableBody = document.querySelector(query); 

//   tableBody.innerHTML = '';

//   // Create an object to store aggregated order information
//   const aggregatedOrders = {};

//   // Iterate through each order
//   for (let i = 0; i < orders.length; i++) {
//        const order = orders[i];
       
//        // If the order_id already exists in aggregatedOrders, update the order information
//        if (aggregatedOrders.hasOwnProperty(order.order_id)) {
//            aggregatedOrders[order.order_id].item_num.push(order.item_num);
//            aggregatedOrders[order.order_id].item_prices.push(order.item_price);
//            aggregatedOrders[order.order_id].item_descriptions.push(order.item_description);
//        } else { // If the order_id doesn't exist, create a new entry in aggregatedOrders
//            aggregatedOrders[order.order_id] = {
//                order_id: order.order_id,
//                status: order.status,
//                date_created: order.date_created,
//                total_price: order.total_price,
//                item_num: [order.item_num],
//                item_prices: [order.item_price],
//                item_descriptions: [order.item_description]
//            };
//        }
//    }

//    // Iterate through aggregatedOrders and display the aggregated order information
//    for (const orderId in aggregatedOrders) {
//        if (aggregatedOrders.hasOwnProperty(orderId)) {
//            const row = tableBody.insertRow();
//            const order = aggregatedOrders[orderId];
//            row.insertCell().textContent = order.order_id;
//            row.insertCell().textContent = order.status;
//            row.insertCell().textContent = order.date_created;
//            row.insertCell().textContent = order.total_price.toFixed(2);
//            row.insertCell().textContent = order.item_num.join(', '); // Join item_num array into a single string
//            row.insertCell().textContent = order.item_prices.reduce((acc, curr) => acc + curr, 0).toFixed(2); // Calculate total item price
//            row.insertCell().textContent = order.item_descriptions.join(', '); // Join item_descriptions array into a single string
//        }
//    }
// }

function displayOrders(query, orders) {
    const tableBody = document.querySelector(query); 
  
    tableBody.innerHTML = '';
    let orderStatusCell;
    for (let i = 0; i < orders.length; i++) {
        let j = -1;
        const row = tableBody.insertRow();
        const order = orders[i];
        row.insertCell().textContent = order.order_id;
        const statusCell = row.insertCell();
        const statusSelect = document.createElement('select');
        const statusOptions = ['Processing', 'Started', 'Ready (For Pickup)', 'Ready (For Delivery)', 'In-Transit', 'Delivered', 'Canceled', 'Rejected', 'Refunded'];
        statusOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            statusSelect.appendChild(optionElement);
        });
        statusSelect.value = order.status;
        statusSelect.addEventListener('change', function() {
            const newStatus = this.value.trim();
            if (newStatus !== order.status) {
                const changeMessage = "Changed status of " + order.item_description + " to " + newStatus;
                statusUpdated.push(changeMessage);
                order.status = newStatus;
            }
            const updateQuery = 'UPDATE customer_order SET status = "' + newStatus + '" WHERE order_id = ?';
            
        });
        statusCell.appendChild(statusSelect);
        row.insertCell().textContent = order.date_created;
        row.insertCell().textContent = order.total_price.toFixed(2);
        row.insertCell().textContent = order.item_num;
        row.insertCell().textContent = order.item_price.toFixed(2);
        row.insertCell().textContent = order.item_description;
     }
  }
  

// Fetch SQL datbase order items
async function initialize() {
     const response = await fetch("/order/getPastOrders", {
        method: "GET",
      });
      const past_orders = await response.json();
      return past_orders;
}

const button1 = document.getElementById("changeStatusButton");

button1.addEventListener("click", function() {
    //prolly have to make a call to the backend and call path back to this same page, just so we can quickly connect to the database and update the status of the order in the table
    //vineal do this pls
});