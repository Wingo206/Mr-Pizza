/* 
 * This is an example front-end script to verify that when
 * an html file is loaded, front-end scripts can be run as well
 */

/*
To Do
For Order Page
-Get items from the cart (from menu team) //WILL BE DONE WHEN CART IS FIXED 
-Make sure that stripe total cost is being retrieved from cart
-Make sure only customers can make orders
-Combine stripe checkout with the page checkout button 
-Add option to add rewards (will subtract from total)

For Order Status
-Show contents of order
-Fix orderid increments
-The quantity needs to be fixed, read how many items there are then update quantity
-The table should display the current order's order id
-Link check delivery takeout to map page 
-Check When the Order Status is updated (loop/continously check) Reload the page if status changes
-make cancel order use runquery instead of new connection (and refund functionality)
-Show PP earned and total PP
-email fix for confirmation order

For Past Order
Make status a button or drop down
For table, have the rows be order id, then split the rows further for each small item
Make status update in database
*/

import {cartEntry, populateCartTable, calculateTotalCost, displayCart} from './orderFunctions.js';

const cartItems = await getCartItems();
let orderId = undefined;

//document.addEventListener('DOMContentLoaded', function() {
  //console.log(cartItems);
  console.log("Cart Items:");
  let orderQuantity = 0;
  let midList = [];
  cartItems.forEach(item => {
      orderQuantity += item.quantity;
      midList.push({mid: item.mid, price: item.price});
      //console.log("orderQuantity " + orderQuantity);
      console.log("midList " + midList);
      console.log(item);
  });

  const cartEntries2 = cartItems.map(item => new cartEntry(
    item.description, item.quantity, item.price, item.price * item.quantity
  ));

  const orderItemData = [];

  let total = 0; 
  cartItems.forEach((entry) => {
    for (let j = 0; j < entry.quantity; j++) {
      console.log("mid: " + entry.mid);
      orderItemData.push({order_id: 0, mid: entry.mid});
    }
    total += entry.price * entry.quantity;
  });
  

  console.log("HELLLLLLLLLLLLLO");
  populateCartTable('#cart tbody', cartEntries2);
  const totalCost = calculateTotalCost(cartEntries2);
  console.log('Total cost:', totalCost);


console.log("THIS IS THE TOTAL " + total);
//edit this stuff
let orderData = [
  {
    made_at: 1,
    credit_card: '1234567890123456',
    status: 'Processing',
    total_price: total,
    DT_created: '2024-03-25 10:00:00',
    DT_delivered: null,
    ordered_by: 1
  }
];


//});

//things i need are the 
//menu id, store, delivery address, 

//We wouldn't have the credit card and stuff so maybe we have to edit the order after the checkout, maybe a new route or a new query to the database 
//same for made at, or well it needs to update when the status changes REMEMBER 

let rewardText = await displayReward();
const rewardsContainer = document.getElementById('rewardsContainer');
rewardsContainer.textContent = "Your Reward Points: " + rewardText[0].rewards_points;

document.getElementById('applyRewards').addEventListener('click', async function() {
  if (rewardText[0].rewards_points < 5) {
    alert('Need 5 reward points to redeem free item!');
    return;
  }
  if (orderQuantity < 1) {
    alert('You need at least two items in your order to use rewards!');
    return;
  }
  let priceUnder20 = false; 
  let highestPriceMid = 0;
  let highestPriceMidIndex = 0;
  for (let i = 0; i < midList.length; i++) {
    if (midList[i].price < 20) {
      console.log("midList Prices: " + midList[i].price);
      priceUnder20 = true;
      if (highestPriceMid < midList[i].price) {
        highestPriceMid = midList[i].price;
        highestPriceMidIndex = i;
      }
    }
  }
  if (!priceUnder20) {
    alert('You can only apply rewards to items that are under 20 dollars!')
    return;
  }
  total = total - highestPriceMid;
  console.log("ARYAAAAAA" + orderData[0].total_price);
  orderData[0].total_price = total; 
  console.log("VINEALLLLL" + orderData[0].total_price);

  //need sql to subtract the points 
  //pick the highest amount here 
  //subtract form the total 
  //and then show that the item is 0???

  let redeemText = await redeemReward();
  
  rewardText = await displayReward();
  rewardsContainer.textContent = "Your Reward Points: " + rewardText[0].rewards_points;

  console.log(JSON.stringify(redeemReward));
  alert(JSON.stringify(redeemText));
  //reward stuff here 
});


const cart = [new cartEntry("pizza", 2, 11.99, 11.99 * 2), new cartEntry('wings', 1, 6.99, 6.99)];
const stripe = Stripe('pk_test_51OxFUuP5gIWmEZ1PniORZnxF5lBrVHSaZzQeI836MWHDsr2cjqRsiFOoolY5yP9zQse5Sar1T0s0hwpy6QwKbfhX00MVSoX1UQ')
let isThereTip = false;
const button1 = document.getElementById("checkoutButton");
const button2 = document.getElementById("tipButton");
//console.log(cart);


function newCartTable(query, orderData, menuItemData, orderItemData) {
  const tableBody = document.querySelector(query);
  tableBody.innerHTML = '';

  // Assuming there's only one item in the cart
  for (let i = 0; i < orderItemData.length; i++) {
    const order = orderData[0];
    const orderItem = orderItemData[i];
    const menuItem = menuItemData[orderItem.mid-1];

  
    const row = tableBody.insertRow();
    row.insertCell().textContent = capitalizeFirstLetter(menuItem.description);
    row.insertCell().textContent = 1; // Assuming you have a quantity field in orderItemData
    row.insertCell().textContent = menuItem.price;
    row.insertCell().textContent = order.total_price;
  }
  
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function getCartItems() {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  return cartItems;
}

//window.addEventListener('load', newCartTable("#cart tbody", orderData, menuItemData, orderItemData));

window.addEventListener('load', () => {
  window.addAddressForm('addressInputForm', onAddressConfirm);
  refreshCheckoutButton();
})

let currentAddress;
/**
 * called once the address form is confirmed
 */
function onAddressConfirm(formattedAddress, location) {
  console.log(formattedAddress);
  console.log(location);
  currentAddress = formattedAddress;
  // update the current order as well
  orderData[0].delivery_address = currentAddress;
  console.log(orderData[0]);
  document.getElementById('currentAddress').innerHTML = `Current address: ${currentAddress}`;

  refreshCheckoutButton();
}

/**
 * disable the checkout button if the address is not confirmed
 * called once on window load
 */
function refreshCheckoutButton() {
  if (currentAddress == undefined) {
    button1.disabled = true;
  } else  {
    button1.disabled = false;
  }
}

async function checkoutButtonOnClick() {
  alert("Total cost of cart: " + calculateTotalCost(cart));
}

// initialize();


button2.addEventListener("click", function () {
  //document.getElementById("tip").removeAttribute("hidden");
  isThereTip = true;
  initializeCheckout(); // Reinitialize checkout whenever tip is toggled
  alert("Tip added");
});

button1.addEventListener("click", async function () {

    document.getElementById("checkout").removeAttribute("hidden");
    //if statement that checks if the time is within 9 am to 4:30 am, if it isnt then print we are closed, please order during opening hours and 30 minutes before the store closes
    
    // let currentTime = new Date();
    // if(currentTime.getHours() < 9 || currentTime.getHours() > 17){
    //   alert("We are closed, please order during within operating hours 9 AM to 5 PM. Please place your order 30 minutes before closing time");
    //   return;
    // }

    const fetchReponse = async () => {
      const response = await fetch("/order/postOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json" // Specify the content type as JSON
        },
        body: JSON.stringify({orderData, orderItemData})
      });
      const responseData = await response.json();
      orderId = responseData.orderId;
      alert(JSON.stringify(responseData));
      
    }
  
    await fetchReponse();
    initializeCheckout();
  
});

async function initializeCheckout() {
  const clientSecret = await fetchClientSecret();
  const checkout = await stripe.initEmbeddedCheckout({
    clientSecret,
  });
  
  checkout.mount('#checkout');
}

async function fetchClientSecret() {
  const response = await fetch("/order/createCheckoutSession", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ total: total, tip: isThereTip, orderId : orderId})
  });
  const { client_secret } = await response.json();
  return client_secret;
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

async function redeemReward() {
  //check if certain mids that are elligble are in the order
  //if they are find the greatest price
  //make that one free send here to verify 
  //One SQL query 
  //Subtract 5 points which will be another query 
  //Quantity, all mids, 
  //return 
  //error not enough quantity
  //nothing under 20 
  //item that is free
  //return price 
  //subtract this from the total 
  //repopulate the table and update the stripe 
  const response = await fetch("/order/redeemRewards", {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      }
  });
  const message = await response.json();
  console.log(JSON.stringify(message));
  return message;
}