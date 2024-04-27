import {cartEntry, populateCartTable, calculateTotalCost} from './orderFunctions.js';

const cartItems = await getCartItems();
let orderId = undefined;

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

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const currentDate = new Date();
const formattedDate = formatDate(currentDate);

//edit this stuff
//MADE AT NEEDS TO BE REPLACED WITH STORE ID 
let orderData = [
  {
    made_at: 1,
    status: 'Processing',
    delivery_address: null,
    total_price: total,
    DT_created: formattedDate,
    DT_delivered: null,
    ordered_by: null
  }
];

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
const addressButton = document.getElementById("loadScriptButton");
addressButton.addEventListener("click", function () {
    // Assuming addAddressForm and refreshCheckoutButton are available and correctly defined elsewhere.
    window.addAddressForm('addressInputForm', onAddressConfirm);
    refreshCheckoutButton();
});

const reloadButton = document.getElementById("unloadScriptButton");
reloadButton.addEventListener("click", function () {
  window.location.reload();
})

let currentAddress;
/**
 * called once the address form is confirmed
 */
function onAddressConfirm(formattedAddress, location) {
  currentAddress = formattedAddress;
  // update the current order as well
  orderData[0].delivery_address = currentAddress;
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
  //isThereTip = true;
  //initializeCheckout(); // Reinitialize checkout whenever tip is toggled
  //alert("Tip added");
  //document.getElementById("addressInputForm").removeAttribute("hidden");
  //document.getElementById("addressInputForm").setAttribute("hidden");
  element.setAttribute("hidden", "addressInputForm");

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