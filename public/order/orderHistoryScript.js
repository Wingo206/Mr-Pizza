let orders = await initialize();

window.addEventListener('load', displayOrders("#cart tbody", orders));

function addReviewButton(row, reviewInput, item_num) {
    const reviewCell = row.insertCell();
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.addEventListener('click', async () => {
        const review = reviewInput.value;
        if (review.trim() !== '') {
            const response = await fetch("/order/createReview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                  },
                body: JSON.stringify({item_num: item_num, description: review })
            });
            const message = await response;
            return JSON.stringify(message);
            //await review(928, "HElLO");
        } else {
            alert('Please enter a review before submitting.');
        }
    });
    reviewCell.appendChild(submitButton);
}

async function displayOrders(query, orders) {
    console.log(JSON.stringify(orders));
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
            statusCell.textContent = order.status;
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

        const reviewCell = row.insertCell();
        const reviewInput = document.createElement('input');
        reviewInput.type = 'text';
        let placeHold = await getDescription(order.item_num);
        if (placeHold === null) {
            reviewInput.placeholder = 'Type your review here';
        }
        else {
            reviewInput.placeholder = placeHold;
        }
        reviewCell.appendChild(reviewInput);

        addReviewButton(row, reviewInput, order.item_num);
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

async function getDescription(item_num) {
    const response = await fetch("/order/getReview", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
          },
        body: JSON.stringify({ item_num: item_num })
    });
    const message = await response.json();
    console.log("HELLO" + JSON.stringify(message));
    return message;
}