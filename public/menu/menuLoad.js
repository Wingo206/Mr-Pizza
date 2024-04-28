// extract from server
const refresh = async () => {
    try {
        const response = await fetch("/menu", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const menuItems = await response.json();

        displayMenu(menuItems);

    } catch (error) {
        console.error("Error fetching menu items.", error);
    }
}

// display a dynamic menu
const displayMenu = (menuItems) => {
    // find categories to display
    const categoryList = [...new Set(menuItems.map(item => item.category))];

    // reset HTML
    const menuContainer = document.getElementById('menu');
    menuContainer.innerHTML = '';

    // create HTML for each category
    categoryList.forEach(category => {
        const section = document.createElement('section');
        section.classList.add('category');

        const title = document.createElement('h2');
        title.textContent = category;
        section.appendChild(title);

        const contents = document.createElement('ui');
        const items = menuItems.filter(item => item.category === category);
        items.forEach(item => {
            const itemContainer = createItem(item);
            contents.appendChild(itemContainer);
        });
        section.appendChild(contents);

        menuContainer.appendChild(section);

    });

    // event when clicking an item
    const itemButtons = document.querySelectorAll('.item-container');
    itemButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            const selectedItem = menuItems[index];
            console.log(selectedItem);
            if (selectedItem) {
                createPopup(selectedItem);
            } else {
                console.error("Item not found.");
            }
        });
    });

    // event when clicking the search icon
    const searchIcon = document.querySelector('.fa-search');
    searchIcon.addEventListener('click', () => displaySearch(menuItems));
    
}

// create menu item's buttons
const createItem = (itemJSON) => {
    const itemContainer = document.createElement('div');
    itemContainer.classList.add('item-container');

    const imageCut = document.createElement('div');
    imageCut.classList.add('item-image-cut');
    imageCut.style.backgroundImage = `url(${itemJSON.image})`;
    itemContainer.appendChild(imageCut);

    const itemDetails = document.createElement('div');
    itemDetails.classList.add('item-details');

    const itemName = document.createElement('h3');
    itemName.textContent = itemJSON.item_name;
    itemDetails.appendChild(itemName);

    const itemDescription = document.createElement('p');
    itemDescription.textContent = itemJSON.description;
    itemDetails.appendChild(itemDescription);

    itemContainer.appendChild(itemDetails);

    return itemContainer;

}

// create menu item's popups
const createPopup = (item) => {
    const popupContainer = document.createElement('div');
    popupContainer.classList.add('popup');

    const popupContent = document.createElement('div');
    popupContent.classList.add('popup-content');

    const title = document.createElement('h2');
    title.textContent = item.item_name;
    popupContent.appendChild(title);

    const price = document.createElement('p');
    price.textContent = `Price: ${item.price}`;
    popupContent.appendChild(price);

    const image = document.createElement('img');
    image.src = item.image;
    popupContent.appendChild(image);

    const description = document.createElement('p');
    description.textContent = item.description;
    popupContent.appendChild(description);

    if (item.toppings && item.toppings.length > 0){
        const toppingsTitle = document.createElement('h3');
        toppingsTitle.textContent = 'Toppings:';
        popupContent.appendChild(toppingsTitle);

        const toppingList = document.createElement('ul');
        item.toppings.forEach(topping => {
            const toppingItem = document.createElement('li');
            toppingItem.textContent = `${topping.topping_name}: $${topping.price}`;
            toppingList.appendChild(toppingItem);
        });
        popupContent.appendChild(toppingList);
    }

    if (item.size && item.size.length > 0){
        const sizeTitle = document.createElement('h3');
        sizeTitle.textContent = 'Sizes:';
        popupContent.appendChild(sizeTitle);

        const sizeList = document.createElement('ul');
        item.size.forEach(size => {
            const sizeItem = document.createElement('li');
            sizeItem.textContent = `${size.topping_name}: $${size.price}`;
            sizeList.appendChild(sizeItem);
        });
        popupContent.appendChild(sizeList);
    }

    if (item.servingOptions && item.servingOptions.length > 0){
        const servingOptionsTitle = document.createElement('h3');
        servingOptionsTitle.textContent = 'Serving Options:';
        popupContent.appendChild(servingOptionsTitle);

        const servingOptionsList = document.createElement('ul');
        item.servingOptions.forEach(option => {
            const servingOptionItem = document.createElement('li');
            servingOptionItem.textContent = `${option.topping_name}: $${option.price}`;
            servingOptionsList.appendChild(servingOptionItem);
        });
        popupContent.appendChild(servingOptionsList);
    }

    if (item.sauces && item.sauces.length > 0){
        const saucesTitle = document.createElement('h3');
        saucesTitle.textContent = 'Types of Sauces:';
        popupContent.appendChild(saucesTitle);

        const saucesList = document.createElement('ul');
        item.sauces.forEach(sauce => {
            const sauceItem = document.createElement('li');
            sauceItem.textContent = `${sauce.topping_name}: $${sauce.price}`;
            saucesList.appendChild(sauceItem);
        });
        popupContent.appendChild(saucesList);
    }

    if (item.crust && item.crust.length > 0){
        const crustTitle = document.createElement('h3');
        crustTitle.textContent = 'Types of Crust:';
        popupContent.appendChild(crustTitle);

        const crustList = document.createElement('ul');
        item.crust.forEach(type => {
            const crustItem = document.createElement('li');
            crustItem.textContent = `${type.topping_name}: $${type.price}`;
            crustList.appendChild(crustItem);
        });
        popupContent.appendChild(crustList);
    }

    if (item.meats && item.meats.length > 0){
        const meatTitle = document.createElement('h3');
        meatTitle.textContent = 'Types of Meats:';
        popupContent.appendChild(meatTitle);

        const meatList = document.createElement('ul');
        item.meats.forEach(meat => {
            const meatItem = document.createElement('li');
            meatItem.textContent = `${meat.topping_name}: $${meat.price}`;
            meatList.appendChild(meatItem);
        });
        popupContent.appendChild(meatList);
    }

    if (item.nonMeats && item.nonMeats.length > 0){
        const nonMeatTitle = document.createElement('h3');
        nonMeatTitle.textContent = 'Types of Non-Meats:';
        popupContent.appendChild(nonMeatTitle);

        const nonMeatList = document.createElement('ul');
        item.nonMeats.forEach(nonMeat => {
            const noMeatItem = document.createElement('li');
            noMeatItem.textContent = `${nonMeat.topping_name}: $${nonMeat.price}`;
            nonMeatList.appendChild(noMeatItem);
        });
        popupContent.appendChild(nonMeatList);
    }

    if (item.cheese && item.cheese.length > 0){
        const cheeseTitle = document.createElement('h3');
        cheeseTitle.textContent = 'Types of Cheese:';
        popupContent.appendChild(cheeseTitle);

        const cheeseList = document.createElement('ul');
        item.cheese.forEach(cheese => {
            const cheeseItem = document.createElement('li');
            cheeseItem.textContent = `${cheese.topping_name}: $${cheese.price}`;
            cheeseList.appendChild(cheeseItem);
        });
        popupContent.appendChild(cheeseList);
    }

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
        popupContainer.remove();
    });
    popupContent.appendChild(cancelButton);

    const addButton = document.createElement('button');
    addButton.textContent = 'Add to Cart';
    addButton.addEventListener('click', () => {
        addToCart(item)
    });
    popupContent.appendChild(addButton);
    
    popupContainer.appendChild(popupContent);

    document.body.appendChild(popupContainer);
}

// Cart Tool 
const cartIcon = document.querySelector('.fa-shopping-cart');
const cartContainer = document.getElementById('cart-container');

cartIcon.addEventListener('click', function() {
    const isVisible = cartContainer.style.display === 'block';
    cartContainer.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
        displayCartItems();
    }
});

const addToCart = (item) => {
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
    menuContainer.classList.remove('show');
    showPopup(`Item '${item.item_name}' added to cart`);
    console.log(`Item '${item.item_name}' with MID '${item.mid}' added to cart.`);
}

const backButton = document.getElementById('back-button');
backButton.addEventListener('click', function() {
    cartContainer.style.display = 'none';
});

const removeFromCart = (index) => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems(); 
    showPopup('Item removed from cart');
}

const checkoutButton = document.getElementById('checkout-button');
checkoutButton.addEventListener('click', function() {
    window.location.href = 'https://127.0.0.1:8080/order/order.html';
});

const displayCartItems = () => {
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

const showPopup = (message) => {
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

// Search Tool
const displaySearch = (menuItems) => {
    console.log('Search icon clicked');
    const searchContainer = document.createElement('div');
    searchContainer.classList.add('search-popup');

    const searchContent = document.createElement('div');
    searchContent.classList.add('search-content');

    const title = document.createElement('h2');
    title.textContent = 'Search Bar';
    searchContent.appendChild(title);

    const searchText = document.createElement('input');
    searchText.setAttribute('type', 'text');
    searchText.setAttribute('placeholder', 'Type to search...');
    searchText.addEventListener('input', () => searchHandler(searchText, menuItems));
    searchContent.appendChild(searchText);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
        searchContainer.remove();
    });
    searchContent.appendChild(closeButton);

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Original Menu';
    resetButton.addEventListener('click', () => {
        searchContainer.remove();
        refresh();
    });
    searchContent.appendChild(resetButton);
    
    searchContainer.appendChild(searchContent);

    document.body.appendChild(searchContainer);

    searchText.focus();

}

const searchHandler = async (searchText, menuItems) => {
    const items = await window.searchItems(searchText.value, menuItems);
    console.log(items);
    displayMenu(items);
}

// Run menu
document.addEventListener('DOMContentLoaded', () => {
    refresh();
});