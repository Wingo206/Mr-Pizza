const menuItemsContainer = document.getElementById("menu-items-container");
const modalContainer = document.getElementById('menu_item_container');

document.addEventListener("DOMContentLoaded", function() {
    window.addEventListener("load", refresh);

    async function refresh() {
        try {
            const response = await fetch("/menu", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const menuItems = await response.json();
            console.log("Menu items:", JSON.stringify(menuItems));
            displayMenuItems(menuItems);
        } catch (error) {
            console.error("Error fetching menu items.", error);
        }
    }
});

function displayMenuItems(menuItems) {
    menuItemsContainer.innerHTML = '';
    menuItems.forEach(item => {
        const button = document.createElement("button");
        button.textContent = item.description;
        button.addEventListener("click", async function() {
            if (item.available === 0) {
                console.log(`Item with MID '${JSON.stringify(item.mid)}' is not available.`);
            } else {
                console.log("Clicked item:", JSON.stringify(item));
                modalContainer.innerHTML = `
                    <div class="modal-content">
                        <h2>${item.description}</h2>
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
                closeButton.addEventListener("click", function() {
                    modalContainer.classList.remove('show');
                });
        
                const addButton = document.getElementById("add-to-cart");
                addButton.addEventListener("click", async function() {
                    const cartItem = {
                        mid: item.mid,
                        description: item.description,
                        price: item.price,
                        toppings: item.toppings.map(topping => ({
                            topping_name: topping.topping_name,
                            price: topping.price
                        }))
                    };
                    try {
                        const response = await fetch("/cart", {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(cartItem)
                        });
                        if (response.ok) {
                            const result = await response.json();
                            console.log(result);
                            modalContainer.classList.remove('show');
                            showPopup('Item added to cart');
                        } else {
                            console.error("Error adding item to cart:", await response.text());
                        }
                    } catch (error) {
                        console.error("Error adding item to cart:", error);
                    }
                });
        
                const toppingsSection = modalContainer.querySelector('.toppings-section');
                const sizesSection = modalContainer.querySelector('.sizes-section');
        
                toppingsSection.addEventListener('click', function() {
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
        
                sizesSection.addEventListener('click', function() {
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
