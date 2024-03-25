document.addEventListener("DOMContentLoaded", function() {
    const menuItemsContainer = document.getElementById("menu-items-container");
    const modalContainer = document.getElementById('menu_item_container');

    // Call refresh function to fetch menu items when the window is loaded
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
            console.log("Menu items:", menuItems);
            displayMenuItems(menuItems);
        } catch (error) {
            console.error("Error fetching menu items:", error);
        }
    }

    function displayMenuItems(menuItems) {
        menuItemsContainer.innerHTML = ''; // Clear previous menu items
        menuItems.forEach(item => {
            const button = document.createElement("button");
            button.textContent = `${item.description}: $${item.price}`;
            button.style.backgroundImage = `url('${item.image}')`;
            button.addEventListener("click", function() {
                // Handle button click (e.g., display item details)
                console.log(`Clicked on item ${item.mid}`);
                // Display the modal container with item details
                modalContainer.innerHTML = `
                    <div class="modal-content">
                        <h2>${item.description}</h2>
                        <img src="${item.image}" alt="${item.description}">
                        <p>Price: $${item.price}</p>
                        <button id="close">Close</button>
                    </div>`;
                modalContainer.classList.add('show');
                // Add event listener for the "Close" button
                const closeButton = document.getElementById("close");
                closeButton.addEventListener("click", function() {
                    modalContainer.classList.remove('show');
                });
            });
            menuItemsContainer.appendChild(button);
        });
    }
});