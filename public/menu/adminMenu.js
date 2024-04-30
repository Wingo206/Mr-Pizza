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
            description: formData.get('aidescription'),
            mid: formData.get('aimid'),
            price: formData.get('aiprice'),
            image: formData.get('aiimage'),
            item_name: formData.get('aiitemName'),
            category: formData.get('aicategory'),
            available: formData.get('aiavailable') === 'on' // Convert checkbox value to boolean
        };
        sendRequestAdd(requestBody);
    });

    addCustomForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(addCustomForm);
        const requestBody = {
            object: 'custom',
            custom_name: formData.get('accustomName'),
            mid: formData.get('acmid'),
            option_name: formData.get('acoptionName'),
            price: formData.get('acprice'),
            isDefault: formData.get('acisDefault') === 'on', // Convert checkbox value to boolean
            available: formData.get('acavailable') === 'on', // Convert checkbox value to boolean
            mutually_exclusive: formData.get('acmutuallyExclusive') === 'on' // Convert checkbox value to boolean
        };

        sendRequestAdd(requestBody);
    });

    editItemForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(editItemForm);
        const requestBody = {
            object: 'item',
            mid: formData.get('eieditMid'),
            name: formData.get('eieditName'),
            newValue: formData.get('eieditValue'),
            property: formData.get('eieditProperty'),
            action: formData.get('eieditAction')
        };

        sendRequestEdit(requestBody);
    });

    editCustomForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(editCustomForm);
        const requestBody = {
            object: 'custom',
            custom_name: formData.get('eceditCustomName'),
            newValue: formData.get('eceditValue'),
            property: formData.get('eceditProperty'),
            action: formData.get('eceditAction')
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