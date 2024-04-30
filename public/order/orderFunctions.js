export function cartEntry(itemName, quantity, pricePerItem, totalCostOfEntry, mid, options) { 
    this.itemName = itemName; 
    this.quantity = quantity;  
    this.pricePerItem = pricePerItem; 
    this.totalCostOfEntry = totalCostOfEntry; 
    this.mid = mid; 
    this.options = options; 
 } 

export function calculateTotalCost(cart) { 
    let total = 0; 
    for (let i = 0; i < cart.length; i++) { 
       total += cart[i].totalCostOfEntry; 
    } 
    return total; 
 } 

export function displayCart(cart) { 
    let showCart = ""; 
    for (let i = 0; i < cart.length; i++) { 
       let entry = cart[i]; 
       showCart += entry.itemName + " " + entry.quantity + " " + entry.pricePerItem + " " + entry.totalCostOfEntry + "\n"; 
    } 
    return showCart; 
 } 

export function populateCartTable(query, cart) { 
    const tableBody = document.querySelector(query);  

    tableBody.innerHTML = ''; 
 
    for (let i = 0; i < cart.length; i++) { 
         const row = tableBody.insertRow(); 
         console.log(cart[i]); 
         row.insertCell().textContent = capitalizeFirstLetter(cart[i].itemName); 
         row.insertCell().textContent = cart[i].options; 
         row.insertCell().textContent = cart[i].quantity; 
         row.insertCell().textContent = cart[i].pricePerItem; 
         row.insertCell().textContent = cart[i].totalCostOfEntry; 
     } 
 } 

function capitalizeFirstLetter(string) { 
   return string.charAt(0).toUpperCase() + string.slice(1); 
} 