let orders = await fillTable(); 
 
let carryout = await checkDeliverable(); 
console.log("CARRYOUTTTTT" + carryout[0].delivery_address); 
 
window.addEventListener('load', displayOrders("#cart tbody", orders)); 
 
//CHECK IF THE EMAIL HAS BEEN SENT ALREADY 
 
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
 
let rewardText = await displayReward(); 
const rewardsContainer = document.getElementById('rewardsContainer'); 
rewardsContainer.textContent = "Your Reward Points: " + rewardText[0].rewards_points; 
 
//depending on status the image will change  
//so have a big check to see if it changed based on previous then have multiple chekcs inside what status to change to    
var pizzaStatus = document.getElementById('pizzaStatus');  
pizzaStatus.src = "/order/Statuses/Delivery/deliveryProcessing.png";  
  
const savedPizzaImageSrc = getCookie('pizzaImageSrc');  
pizzaStatus.src = savedPizzaImageSrc;  
setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryProcessing.png", 1); // dead in 1 days  
  
const checkStatusInterval = setInterval(async () => {  
      
//when it reload it needs to send back the status from before to check   
    let stat = await checkStatus();  
    // console.log("Stat: " + stat[0].status);  
    const orderStatus = stat[0].status;  
    let cancelStatus = orderStatus;  
  
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
        if (carryout[0].delivery_address == null) {  
            setCookie('pizzaImageSrc', "/order/Statuses/Pickup/pickupProcessing.png", 1); // dead in 1 days  
        }  
        else {  
            setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryProcessing.png", 1); // dead in 1 days  
        }   
        window.location.reload(true);   
    } else if (orderStatus === 'Started') {   
        pizzaStatus.src = "/order/orderedPizzaTrack.png";   
        if (carryout[0].delivery_address == null) {   
            setCookie('pizzaImageSrc', "/order/Statuses/Pickup/pickupStarted.png", 1); // dead in 1 days  
        }  
        else {   
            setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryStarting.png", 1); // dead in 1 days  
        }  
        window.location.reload(true);  
    } else if (orderStatus === 'Ready (For Delivery)') {  
        pizzaStatus.src = "/order/orderedPizzaTrack.png";  
        if (carryout[0].delivery_address == null) {  
            setCookie('pizzaImageSrc', "/order/Statuses/Pickup/pickupReady.png", 1); // dead in 1 days  
        }  
        else {  
            setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryReady.png", 1); // dead in 1 days  
        }  
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
        if (carryout[0].delivery_address == null) {  
            setCookie('pizzaImageSrc', "/order/Statuses/Pickup/pickupComplete.png", 1); // dead in 1 days  
        }  
        else {  
            setCookie('pizzaImageSrc', "/order/Statuses/Delivery/deliveryComplete.png", 1); // dead in 1 days  
        }  
        window.location.reload(true);  
    }         
}  
 
setCookie('orderStatus', orderStatus, 1); // Set cookie to expire in 1 days 
 
}, 5000); //this runs every 5 seconds  
 
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
 
function displayOrders(query, orders) { 
    const tableBody = document.querySelector(query); 
 
    // Clear the existing table rows 
    tableBody.innerHTML = ''; 
 
    let totals = 0; 
    for(let i = 0; i < orders.length; i++) { 
        totals += orders[i].item_price; 
    } 
 
    // Iterate over each order 
let orderSummary = {}; 
 
// Aggregate orders by item_name 
orders.forEach(order => { 
    if (order.item_price === undefined) order.item_price = 0; // Default to 0 if undefined 
 
    if (orderSummary[order.item_name]) { 
        // If the item already exists, increment the quantity and update the total price 
        orderSummary[order.item_name].quantity += 1; 
        orderSummary[order.item_name].totalPrice += order.item_price; 
    } else { 
        // Otherwise, add the new item to the summary 
        orderSummary[order.item_name] = { 
            item_price: order.item_price, 
            quantity: 1, 
            totalPrice: order.item_price 
        }; 
    } 
}); 
 
// Now, insert the aggregated orders into the table 
Object.keys(orderSummary).forEach(itemName => { 
    const order = orderSummary[itemName]; 
    const row = tableBody.insertRow(); 
 
    row.insertCell().textContent = itemName; // Item 
    row.insertCell().textContent = order.quantity; // Quantity 
 
    row.insertCell().textContent = order.item_price.toFixed(2); // Price per Item 
    row.insertCell().textContent = order.totalPrice.toFixed(2); // Total Price for the item 
}); 
 
// Optionally, add a final row for the total price of all items 
const totalRow = tableBody.insertRow(); 
const totalCell = totalRow.insertCell(); 
let grandTotal = Object.values(orderSummary).reduce((acc, cur) => acc + cur.totalPrice, 0); 
totalCell.textContent = "Total Price: " + grandTotal.toFixed(2); 
totalCell.colSpan = 4; // Span across all columns 
 
 
 
console.log("THIS IS THE TOTAL PRICE " + orders[0].total_price + "THIS THE TOTAL" + totals); 
    if (orders[0].total_price.toFixed(2) < totals.toFixed(2)) { 
        document.getElementById("usedRewards").removeAttribute("hidden"); 
        const usedRewards = document.getElementById('usedRewards'); 
        usedRewards.textContent = "You used reward points! You saved a total of $" + (totals.toFixed(2) - orders[0].total_price.toFixed(2)).toFixed(2) + " dollars."; 
    }  
}  
  
  
// Fetch SQL datbase order items and send email  
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
 
async function getOid() { 
    const response = await fetch("/order/getOID", { 
        method: "GET", 
        headers: { 
            "Content-Type": "application/json" 
        }, 
    }); 
    const message = await response.json(); 
    return message; 
} 
 
// Fetch SQL datbase order items just ordered 
async function fillTable() { 
    console.log('lol'); 
    const response = await fetch("/order/getOrder", { 
       method: "GET", 
       headers: { 
        "Content-Type": "application/json" 
        } 
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
 
const button2 = document.getElementById("refundButton"); 
 
button2.addEventListener("click", async function() { 
    let status = await checkStatus(); 
    let currentStatus = status[0].status; 
    if (currentStatus === 'Processing') { 
        alert("Order has been refunded! Please check your bank/credit card statement for the refund."); 
        async function requestRefund(orderId) { 
            fetch('/order/handleRefund', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json', 
                }, 
                body: JSON.stringify({ orderId: orderId }) 
            }) 
            .then(response => response.json()) 
            .then(data => console.log('Refund response:', data)) 
            .catch(error => console.error('Error in refund:', error)); 
        }         
        requestRefund(await getOid());  
        await sendRefundEmail();  
        //after removing return home  
    } 
    else { 
       alert("Too late to cancel Order, submit help request"); 
    } 
}); 
 
const button3 = document.getElementById("cancelOrderButton"); 
 
button3.addEventListener("click", async function() { 
    let stat2 = await checkStatus(); 
 
    if (stat2[0].status === 'Processing' || stat2[0].status === 'Started' || stat2[0].status === 'Ready') { 
        alert("Order has been canceled! It has been marked as canceled and will not be delivered/picked up."); 
        await removeOrder().catch(error => console.error('Error in cancel:', error)); 
        await sendCancelEmail(); 
    } 
    else { 
        alert("Can not cancel since order has passed Ready phase!"); 
    } 
}); 
 
async function removeOrder() { 
    const response = await fetch("/order/cancelOrder", { 
       method: "DELETE", 
       headers: { 
        "Content-Type": "application/json" 
        } 
     }); 
     const message = await response.json(); 
     console.log(message); 
     return message; 
} 
 
async function checkStatus() { 
    const response = await fetch("/order/checkStatus", { 
        method: "GET", 
        headers: { 
            "Content-Type": "application/json" 
        }, 
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
 
async function checkDeliverable() { 
    const response = await fetch("/order/checkOption", { 
        method: "GET", 
        headers: { 
            "Content-Type": "application/json" 
        } 
    }); 
    const message = await response.json(); 
    console.log("Your Reward Points: " + JSON.stringify(message)); 
    return message; 
} 
 
async function sendCancelEmail() { 
     let response = await fetch("/order/emailOrderCancel", { 
        method: "POST", 
        headers: { 
            'Content-Type': 'application/json' 
        } 
      }); 
     console.log(response); 
} 
 
async function sendRefundEmail() { 
    let response = await fetch("/order/emailOrderRefund", { 
       method: "POST", 
       headers: { 
           'Content-Type': 'application/json' 
       } 
     }); 
    console.log(response); 
} 