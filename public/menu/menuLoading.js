document.addEventListener("DOMContentLoaded", function() {
    const menuItemsContainer = document.getElementById("menu-items-container");
    const modalContainer = document.getElementById('menu_item_container');

    // Sample menu items array (replace with actual data fetched from the backend)
    const menuItems = [
        { mid: 1, price: 7.99, image_url: "https://t4.ftcdn.net/jpg/02/11/55/17/360_F_211551718_Ol7eOQYNDK5S8pbEHMkagk9kbdYTJ2iX.jpg", description: "Pizza" },
        { mid: 2, price: 7.99, image_url: "https://t4.ftcdn.net/jpg/01/38/44/27/360_F_138442706_pFbCaNfUlo0pDbnVEq7tId7WWT8E0o8f.jpg", description: "Antipasta" },
        { mid: 3, price: 2.00, image_url: "https://cdn-icons-png.freepik.com/256/8765/8765032.png", description: "Soda" }
    ];

    menuItems.forEach(item => {
        const button = document.createElement("button");
        button.textContent = `Item ${item.mid}: $${item.price}`;
        button.addEventListener("click", function() {
            // Handle button click (e.g., display item details)
            console.log(`Clicked on item ${item.mid}`);
            // Display the modal container with item details
            modalContainer.innerHTML = `
                <div class="modal-content">
                    <h2>${item.description}</h2>
                    <img src="${item.image_url}" alt="${item.description}">
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
});
