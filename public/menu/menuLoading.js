const open = document.getElementById('open');
const modal_container = document.getElementById('menu_item_container');
const close = document.getElementById('close');

open.addEventListener('click', () => {
    modal_container.classList.add('show');  
});

close.addEventListener('click', () => {
    modal_container.classList.remove('show');
});

// async function fetchMenu() {
//     try {
//         let resp = await fetch('/menu', {
//             method: 'GET',
//             headers: {
//                 "Content-type": 'application/json',
//             }
//         });

//         if (resp.status == 200) {
//             let menuData = await resp.json();
//             displayMenu(menuData);
//         } else if (resp.status == 404) {
//             throw new Error('Menu not found.');
//         } else {
//             throw new Error(`Failed to fetch menu. Status: ${resp.status}`);
//         }
//     } catch (error) {
//         console.error('Error fetching menu:', error.message);
//     }
// }

// function displayMenu(menuData) {
//     const menuContainer = document.getElementById('menu-container');

//     menuData.forEach(item => {
//         const menuItem = document.createElement('div');
//         menuItem.classList.add('menu-item');

//         const itemName = document.createElement('h3');
//         itemName.textContent = item.description; // Assuming description is the name of the item

//         const itemPrice = document.createElement('p');
//         itemPrice.textContent = `$${item.price}`;

//         const itemImage = document.createElement('img');
//         itemImage.src = item.image_url; // Assuming 'image_url' is the property containing the URL of the image

//         menuItem.appendChild(itemImage); // Append the image element
//         menuItem.appendChild(itemName);
//         menuItem.appendChild(itemPrice);
//         menuContainer.appendChild(menuItem);
//     });
// }

// fetchMenu();
