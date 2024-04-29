document.addEventListener('DOMContentLoaded', function () {
    const addItemForm = document.getElementById('addItemForm');
    const addCustomForm = document.getElementById('addCustomForm');
    const editItemForm = document.getElementById('editItemForm');
    const editCustomForm = document.getElementById('editCustomForm');

    addItemForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(addItemForm);
        const requestBody = {
            object: 'item',
            description: formData.get('description'),
            mid: formData.get('mid'),
            price: formData.get('price'),
            image: formData.get('image'),
            item_name: formData.get('itemName'),
            category: formData.get('category'),
            available: formData.get('available') === 'on' // Convert checkbox value to boolean
        };

        sendRequestAdd(requestBody);
    });

    addCustomForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(addCustomForm);
        const requestBody = {
            object: 'custom',
            custom_name: formData.get('customName'),
            mid: formData.get('mid'),
            option_name: formData.get('optionName'),
            price: formData.get('price'),
            isDefault: formData.get('isDefault') === 'on', // Convert checkbox value to boolean
            available: formData.get('available') === 'on', // Convert checkbox value to boolean
            mutually_exclusive: formData.get('mutuallyExclusive') === 'on' // Convert checkbox value to boolean
        };

        sendRequestAdd(requestBody);
    });

    editItemForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(editItemForm);
        const requestBody = {
            object: 'item',
            mid: formData.get('editMid'),
            name: formData.get('editName'),
            newValue: formData.get('editValue'),
            property: formData.get('editProperty'),
            action: formData.get('editAction')
        };

        sendRequestEdit(requestBody);
    });

    editCustomForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(editCustomForm);
        const requestBody = {
            object: 'custom',
            custom_name: formData.get('editCustomName'),
            newValue: formData.get('editValue'),
            property: formData.get('editProperty'),
            action: formData.get('editAction')
        };

        sendRequestEdit(requestBody);
    });

    function sendRequestEdit(requestBody) {
        fetch('/menu/edit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to process request');
            }
            alert('Request processed successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while processing request');
        });
    }
    function sendRequestAdd(requestBody) {
        fetch('/menu/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to process request');
            }
            alert('Request processed successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while processing request');
        });
    }
});
