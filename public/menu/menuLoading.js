document.addEventListener("DOMContentLoaded", function() {
    const menuItemsContainer = document.getElementById("menu-items-container");
    const modalContainer = document.getElementById('menu_item_container');

    // Sample menu items array (replace with actual data fetched from the backend)
    const menuItems = [
        { mid: 1, price: 10, image_url: "image1.jpg", description: "Description 1" },
        { mid: 2, price: 15, image_url: "image2.jpg", description: "Description 2" },
        { mid: 3, price: 20, image_url: "image3.jpg", description: "Description 3" }
    ];

    menuItems.forEach(item => {
        const button = document.createElement("button");
        button.textContent = `Item ${item.mid}: $${item.price}`;
        button.addEventListener("click", function() {
            // Handle button click (e.g., display item details)
            console.log(`Clicked on item ${item.mid}`);
            // Display the modal container with item details
            modalContainer.innerHTML = `
                <h2>Item ${item.mid}</h2>
                <p>${item.description}</p>
                <button id="close">Close</button>`;
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
