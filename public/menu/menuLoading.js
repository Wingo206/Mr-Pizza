const menuItemsContainer = document.getElementById("menu-items-container");
const modalContainer = document.getElementById('menu_item_container');

let storeId;

document.addEventListener("DOMContentLoaded", function () {
    window.addEventListener("load", async () => {
        // get the store id from the cookies
        storeId = getCookie('menuStoreId')

        // load store options
        let resp = await fetch('/storeNames', {
            method: 'GET'
        })
        let storeNames = await resp.json();
        console.log(storeNames)

        // populate dropdown
        let select = document.getElementById('store-select');
        select.innerHTML = storeNames.map(sn => `<option value="${sn.store_id}">${sn.name}</option>`)
        select.onchange = (event) => {
            storeId = Number(event.target.value);
            console.log('changing store id to ' + storeId)
            refresh();
        }

        refresh();
    });
});

async function refresh() {
    // don't load if there's no selected store id
    if (storeId == undefined) {
        menuItemsContainer.innerHTML = `<p>No store selected.</p>`
        return;
    }

    try {
        const response = await fetch("/menu/" + storeId, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const menuItems = await response.json();
        console.log("Menu items:", JSON.stringify(menuItems));
        // no menu items
        if (menuItems.length == 0) {
            menuItemsContainer.innerHTML = `<p>No Available Items for this store.</p>`
            return;
        }
        displayMenuItems(menuItems);
    } catch (error) {
        console.error("Error fetching menu items.", error);
    }
}

function displayMenuItems(menuItems) {
    menuItemsContainer.innerHTML = '';
    menuItems.forEach(item => {
        const button = document.createElement("button");
        button.textContent = item.item_name;
        button.addEventListener("click", async function () {
            if (item.available === 0) {
                console.log(`Item with MID '${JSON.stringify(item.mid)}' is not available.`);
            } else {
                console.log("Clicked item:", JSON.stringify(item));
                modalContainer.innerHTML = `
                    <div class="modal-content">
                        <h2>${item.item_name}</h2>
                        <img src="${item.image}" alt="${item.description}">
                        <p>Price: $${item.price}</p>
                        <div class="toppings-section">
                            <p>Toppings:</p>
                            <ul class="toppings-list">
                                ${item.toppings.map(topping => `<li>${topping.topping_name}: $${topping.price}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="sizes-section">
                            <p>Sizes:</p>
                            <ul class="sizes-list">
                                ${item.size.map(size => `<li>${size.topping_name}: $${size.price}</li>`).join('')}
                            </ul>
                        </div>
                        <button id="close">Close</button>
                        <button id="add-to-cart" style="float: right;">Add to Cart</button> <!-- Float to right -->
                    </div>`;
                modalContainer.classList.add('show');

                const closeButton = document.getElementById("close");
                closeButton.addEventListener("click", function () {
                    modalContainer.classList.remove('show');
                });

                const addButton = document.getElementById("add-to-cart");
                addButton.addEventListener("click", async function () {
                    addToCart(item);
                });

                const toppingsSection = modalContainer.querySelector('.toppings-section');
                const sizesSection = modalContainer.querySelector('.sizes-section');

                toppingsSection.addEventListener('click', function () {
                    if (item.toppings.length === 0) {
                        console.log(`Item '${item.description}' with MID '${item.mid}' has no toppings.`);
                    }

                    const toppingsList = toppingsSection.querySelector('.toppings-list');
                    if (toppingsList.style.display === 'none') {
                        toppingsList.style.display = 'block';
                    } else {
                        toppingsList.style.display = 'none';
                    }
                });

                sizesSection.addEventListener('click', function () {
                    if (item.size.length === 0) {
                        console.log(`Item '${item.description}' with MID '${item.mid}' has no sizes.`);
                    }

                    const sizesList = sizesSection.querySelector('.sizes-list');
                    if (sizesList.style.display === 'none') {
                        sizesList.style.display = 'block';
                    } else {
                        sizesList.style.display = 'none';
                    }
                });
            }
        });

        menuItemsContainer.appendChild(button);
    });
}

function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let alreadyInCart = cart.find(cartItem => cartItem.mid === item.mid);

    if (alreadyInCart) {
        alreadyInCart.quantity += 1;
        alreadyInCart.totalPrice = alreadyInCart.quantity * item.price;
    }
    else {
        cart.push({
            item_name: item.item_name,
            mid: item.mid,
            description: item.description,
            quantity: 1,
            price: item.price,
            totalPrice: item.price,
            toppings: item.toppings.map(topping => ({
                topping_name: topping.topping_name,
                price: topping.price
            })),
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    modalContainer.classList.remove('show');
    showPopup(`Item '${item.item_name}' added to cart`);
    console.log(`Item '${item.item_name}' with MID '${item.mid}' added to cart.`);
}

const cartIcon = document.querySelector('.fa-shopping-cart');
const cartContainer = document.getElementById('cart-container');

cartIcon.addEventListener('click', function () {
    const isVisible = cartContainer.style.display === 'block';
    cartContainer.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
        displayCartItems();
    }
});

// function to display cart items
function displayCartItems() {
    const cartItemsElement = document.getElementById('cart-items');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartItemsElement.innerHTML = '';

    cart.forEach((item, index) => {
        const cartItemElement = document.createElement('div');
        cartItemElement.classList.add('cart-item');
        cartItemElement.innerHTML = `
            <span>${item.item_name} - Qty:${item.quantity} - $${item.totalPrice}</span>
            <span class="remove-item" onclick="removeFromCart(${index})">&times;</span>
        `;
        cartItemsElement.appendChild(cartItemElement);
    });
}

// function to remove item from cart
function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems();
    showPopup('Item removed from cart');
}

const backButton = document.getElementById('back-button');
backButton.addEventListener('click', function () {
    cartContainer.style.display = 'none';
});

const checkoutButton = document.getElementById('checkout-button');
checkoutButton.addEventListener('click', function () {
    window.location.href = 'https://127.0.0.1:8080/order/order.html';
});

function showPopup(message) {
    const popup = document.createElement("div");
    popup.textContent = message;
    popup.style.position = "fixed";
    popup.style.bottom = "20px";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.backgroundColor = "green";
    popup.style.color = "white";
    popup.style.padding = "10px";
    popup.style.borderRadius = "5px";
    popup.style.zIndex = "1000";
    document.body.appendChild(popup);
    setTimeout(() => {
        document.body.removeChild(popup);
    }, 3000);
}

// cookie stuff for getting the store id
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function eraseCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
