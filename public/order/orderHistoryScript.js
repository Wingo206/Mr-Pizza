
import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';
// const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];
// console.log(cart);
let statusUpdated = new Array();

// window.addEventListener('load', populateCartTable("#cart tbody", cart));
// //there would be calls to database here instead
let orders = await initialize();
// console.log(orders);
window.addEventListener('load', displayOrders("#cart tbody", orders));

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
     const response = await fetch("/order/getCustomerOrder", {
        method: "GET",
      });
      const past_orders = await response.json();
      return past_orders;
}