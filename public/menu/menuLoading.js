async function fetchMenu() {
    try {
       let resp = await fetch('/menu', {
          method: 'GET',
          headers: {
             "Content-type": 'application/json',
          }
       });
 
       if (resp.status == 200) {
          let menuData = await resp.json();
          displayMenu(menuData);
       } else if (resp.status == 404) {
          throw new Error('Menu not found.');
       } else {
          throw new Error(`Failed to fetch menu. Status: ${resp.status}`);
       }
    } catch (error) {
       console.error('Error fetching menu:', error.message);
    }
 }
 
 function displayMenu(menuData) {
    //
    console.log(menuData);
 }
 
 fetchMenu();
 