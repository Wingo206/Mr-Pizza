
import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';
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
    let previousOrderID = null;

    const itemCountPerOrder = orders.reduce((acc, order) => {
        if (acc[order.order_id]) {
            acc[order.order_id]++;
        } else {
            acc[order.order_id] = 1;
        }
        return acc;
    }, {});

    for (let i = 0; i < orders.length; i++) {
        const row = tableBody.insertRow();
        const order = orders[i];
        if (order.order_id !== previousOrderID) {
            const orderIDCell = row.insertCell();
            orderIDCell.textContent = order.order_id;
            orderIDCell.rowSpan = itemCountPerOrder[order.order_id];
            previousOrderID = order.order_id;

            const storeIDCell = row.insertCell();
            storeIDCell.textContent = order.made_at;
            storeIDCell.rowSpan = itemCountPerOrder[order.order_id];

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
                updateStatus(order.order_id, newStatus);
            });
            statusCell.appendChild(statusSelect);
            statusCell.rowSpan = itemCountPerOrder[order.order_id];

            const dateCreatedCell = row.insertCell();
            dateCreatedCell.textContent = order.date_created;
            dateCreatedCell.rowSpan = itemCountPerOrder[order.order_id];;
    
            if (order.total_price == undefined) {
                order.total_price = 0;
            }
            
            const totalPriceCell = row.insertCell();
            totalPriceCell.textContent = order.total_price.toFixed(2);
            totalPriceCell.rowSpan = itemCountPerOrder[order.order_id];;
        }

        if (order.item_price == undefined) {
            order.item_price = 0;
        }

        const itemNumCell = row.insertCell();
        itemNumCell.textContent = order.item_num;

        const itemPriceCell = row.insertCell();
        itemPriceCell.textContent = order.item_price.toFixed(2);

        const itemDescCell = row.insertCell();
        itemDescCell.textContent = order.item_description;
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

async function updateStatus(orderId, newStatus) {
    const response = await fetch("/order/setStatus", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            order_id: orderId,
            newStatus: newStatus,
        }),
    });
    const result = await response.json();
    //console.log(result);
}

const button1 = document.getElementById("changeStatusButton");

button1.addEventListener("click", function() {
    //prolly have to make a call to the backend and call path back to this same page, just so we can quickly connect to the database and update the status of the order in the table
    //vineal do this pls
    // for(let i = 0;)
    // updateStatus(orders[1].order_id, orders[1].status);
});