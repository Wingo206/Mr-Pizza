import {cartEntry, populateCartTable, calculateTotalCost} from './orderFunctions.js';

const cartItems = await getCartItems();
let orderId = undefined;
let isDelivery = false;
console.log("This is isDelivery: " + isDelivery);

  let orderQuantity = 0;
  let midList = [];
  cartItems.forEach(item => {
      console.log(item);
      orderQuantity += item.quantity;
      midList.push({mid: item.mid, price: item.price});
      item.selectedOptions.forEach(option => {
        console.log("Option: " + option.name + ": $" + option.price);
    });
  });
  const cartEntries2 = cartItems.map(item => new cartEntry(
    item.item_name, item.quantity, item.price + item.optionsPrice, item.totalPrice, item.mid, item.selectedOptions.map(option => `${option.name}: $${option.price}`).join(', ')
  ));

  const orderItemData = [];

  let total = 0; 
  cartItems.forEach((entry) => {
    for (let j = 0; j < entry.quantity; j++) {
      orderItemData.push({order_id: 0, mid: entry.mid});
    }
    total += entry.totalPrice;
    //total += entry.size;
  });
  total = total.toFixed(2);

  populateCartTable('#cart tbody', cartEntries2);

  // Optionally, add a final row for the total price of all items
  const tableBody = document.querySelector("#cart tbody");
  const totalRow = tableBody.insertRow();
  const totalCell = totalRow.insertCell();
  totalCell.textContent = "Order Price: " + total;
  totalCell.colSpan = 5; // Span across all columns

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
  total = total.toFixed(2);
  orderData[0].total_price = total; 

  let redeemText = await redeemReward();
  
  rewardText = await displayReward();
  rewardsContainer.textContent = "Your Reward Points: " + rewardText[0].rewards_points;

  console.log(JSON.stringify(redeemReward));
  alert(JSON.stringify(redeemText));
});


const stripe = Stripe('pk_test_51OxFUuP5gIWmEZ1PniORZnxF5lBrVHSaZzQeI836MWHDsr2cjqRsiFOoolY5yP9zQse5Sar1T0s0hwpy6QwKbfhX00MVSoX1UQ')
let isThereTip = false;
const button1 = document.getElementById("checkoutButton");
const button2 = document.getElementById("tipButton");

const addressButton = document.getElementById("loadScriptButton");
addressButton.addEventListener("click", function () {
    isDelivery = true;
    // Assuming addAddressForm and refreshCheckoutButton are available and correctly defined elsewhere.
    window.addAddressForm('addressInputForm', onAddressConfirm);
    refreshCheckoutButton();
});

const reloadButton = document.getElementById("unloadScriptButton");
reloadButton.addEventListener("click", function () {
  isDelivery = false;
  console.log(isDelivery);
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

button2.addEventListener("click", function () {
  isThereTip = true;
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

  console.log(orderData)
    const fetchReponse = async () => {
      const response = await fetch("/order/postOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json" // Specify the content type as JSON
        },
        body: JSON.stringify({orderData, orderItemData, isDelivery}) //add isDelivery to this
      });
      const responseData = await response.json();
      orderId = responseData.orderId;
      alert(responseData.message);
      button1.disabled = true;

    }
  
    await fetchReponse();
    initializeCheckout();
  
});

async function getCartItems() {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  return cartItems;
}

async function initializeCheckout() {
  button2.style.visibility = 'hidden';

  const clientSecret = await fetchClientSecret();
  const checkout = await stripe.initEmbeddedCheckout({
    clientSecret,
  });
  
  checkout.mount('#checkout');
}

async function fetchClientSecret() {
  let newTotal = (parseFloat(total)).toFixed(2);
  console.log(newTotal);
  const response = await fetch("/order/createCheckoutSession", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ total: newTotal, tip: isThereTip, orderId : orderId})
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
