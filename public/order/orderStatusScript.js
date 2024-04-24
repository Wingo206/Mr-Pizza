
import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';
const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];
console.log(cart);

//await initialize();
console.log("FILL TABLE");
let orders = await fillTable();

window.addEventListener('load', displayOrders("#cart tbody", orders));

//at the start maybe even before load cart you want to query the database based on the user's login 
//like using the cid get the order that is not completed and display it, even if there are multiple orders, prolly match it to cid and items ordered, for now cid
//let testingOID = await getOid();
//console.log(testingOID);

//CHECK IF THE EMAIL HAS BEEN SENT ALREADY

await displayReward();

const savedEmailSent = getCookie("emailSent");
const savedEmailOrder = getCookie("emailOrder");

if (savedEmailSent === 'Sent') {
    let retrievedOID = await getOid();
    if (savedEmailOrder != retrievedOID) {
        setCookie('emailSent', "Sent", 1); // dead in 1 days
        setCookie('emailOrder', retrievedOID, 1); // dead in 1 days
        await initialize();
    }
}
else {
    setCookie('emailSent', "Sent", 1); // dead in 1 days
    await initialize();
}

//depending on status the image will change 
//so have a big check to see if it changed based on previous then have multiple chekcs inside what status to change to 
var pizzaStatus = document.getElementById('pizzaStatus');
pizzaStatus.src = "/order/Statuses/Delivery/deliveryProcessing.png";

const savedPizzaImageSrc = getCookie('pizzaImageSrc');
pizzaStatus.src = savedPizzaImageSrc;
setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryProcessing.png", 1); // dead in 1 days
let cancelStatus;

const checkStatusInterval = setInterval(async () => {
    
//when it reload it needs to send back the status from before to check 
    let stat = await checkStatus();
    console.log("Stat: " + stat[0].status);
    const orderStatus = stat[0].status;
    cancelStatus = orderStatus;

    if (cancelStatus === 'Delivered') {
        document.getElementById("notReceivedButton").removeAttribute("hidden");
    }

    let savedStatus = getCookie('orderStatus');
    console.log(savedStatus);
    
if (orderStatus != savedStatus) {
    if (orderStatus === 'Ready (For Pickup)') {
        pizzaStatus.src = "/order/orderedPizzaTrack2.png";
        setCookie('pizzaImageSrc', "/order/Statuses/Pickup/pickupReady.png", 1); // dead in 1 days
        window.location.reload(true);
    } else if (orderStatus === 'Processing') {
        pizzaStatus.src = "/order/orderedPizzaTrack.png";
        setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryProcessing.png", 1); // dead in 1 days
        window.location.reload(true);
    } else if (orderStatus === 'Started') {
        pizzaStatus.src = "/order/orderedPizzaTrack.png";
        setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryStarting.png", 1); // dead in 1 days
        window.location.reload(true);
    } else if (orderStatus === 'Ready (For Delivery)') {
        pizzaStatus.src = "/order/orderedPizzaTrack.png";
        setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryReady.png", 1); // dead in 1 days
        window.location.reload(true);
    } else if (orderStatus === 'In-Transit') {
        pizzaStatus.src = "/order/orderedPizzaTrack.png";
        setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryInTransit.png", 1); // dead in 1 days
        window.location.reload(true);
    } else if (orderStatus === 'Delivered') {
        pizzaStatus.src = "/order/orderedPizzaTrack.png";
        setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryDelivered.png", 1); // dead in 1 days
        window.location.reload(true);
    } else if (orderStatus === 'Canceled') {
        pizzaStatus.src = "/order/orderedPizzaTrack.png";
        setCookie('pizzaImageSrc', "/order/Statuses/Misc/miscCancelled.png", 1); // dead in 1 days
        window.location.reload(true);
    } else if (orderStatus === 'Rejected') {
        pizzaStatus.src = "/order/orderedPizzaTrack.png";
        setCookie('pizzaImageSrc', "/order/Statuses/Misc/miscRejected.png", 1); // dead in 1 days
        window.location.reload(true);
    } else if (orderStatus === 'Refunded') {
        pizzaStatus.src = "/order/orderedPizzaTrack.png";
        setCookie('pizzaImageSrc', "/order/Statuses/Misc/miscRefunded.png", 1); // dead in 1 days
        window.location.reload(true);
    } 
    else if (orderStatus === 'Completed') {
        pizzaStatus.src = "/order/orderedPizzaTrack.png";
        setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryComplete.png", 1); // dead in 1 days
        window.location.reload(true);
    }       
}

setCookie('orderStatus', orderStatus, 1); // Set cookie to expire in 1 days

}, 5000); //this runs every 5 seconds 

//console.log(cancelStatus);

// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Function to get a cookie
function getCookie(name) {
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length + 1, cookie.length);
        }
    }
    return null;
}

//add order to database 

function displayOrders(query, orders) {
    const tableBody = document.querySelector(query);

    // Clear the existing table rows
    tableBody.innerHTML = '';

    let totals = 0;
    for(let i = 0; i < orders.length; i++) {
        totals += orders[i].item_price;
    }

    // Iterate over each order
    orders.forEach(order => {
        // Create a new row for each order
        const row = tableBody.insertRow();

        // Insert the order details into the table cells
        row.insertCell().textContent = order.item_description; // Item
        row.insertCell().textContent = 1; // Quantity WE DONT ACTUALLY STORE QUANTITY
        if (order.item_price == undefined) {
            order.item_price = 0;
        }
        if (order.item_num == undefined) {
            order.item_num = 0;
        }
        row.insertCell().textContent = order.item_price.toFixed(2); // Price per Item
        row.insertCell().textContent = (1 * order.item_price).toFixed(2); // Total Price
        row.insertCell().textContent = totals; // Order Price

        //Need a total price
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
     const email = "pewdiepie285@gmail.com";
     const order_id = "9";
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

//CHANGE THIS ASK BRANDON HOW TO GET CURRENT USER INFO AND BASED ON THAT WE PLUG IN TO QUERY DATABASE
async function getOid() {
    const response = await fetch("/order/getOID", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
    });
    const message = await response.json();
    console.log(message);
    return message;
}

// Fetch SQL datbase order items just ordered
// right now body is hardcoded but should retrieve from last page 
async function fillTable() {
    console.log('lol');
    const requestBody = JSON.stringify({ order_id: 11 });
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

    if (cancelStatus === 'Processing') {
        alert("Cancel Order and return home");
        let message = await removeOrder();
        //after removing return home 
    }
    else {
       alert("Too late to cancel Order, submit help request");
    }
 
});

async function removeOrder() {
    console.log('lol');
    const requestBody = JSON.stringify({ order_id: 9 });
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

async function checkStatus() {
    console.log('lol');
    const requestBody = JSON.stringify({ order_id: 9});
    const response = await fetch("/order/checkStatus", {
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

async function displayReward() {
    const response = await fetch("/order/getRewards", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const message = await response.json();
    console.log("Your Reward Points: " + JSON.stringify(message));
    return message;
}