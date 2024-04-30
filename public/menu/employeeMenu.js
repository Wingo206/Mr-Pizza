document.addEventListener('DOMContentLoaded', function () {
    const editAvailabilityFormItem = document.getElementById('availabilityFormItem');
    const editAvailabilityFormCustom = document.getElementById('availabilityFormCustom');

    editAvailabilityFormItem.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(editAvailabilityFormItem);
        const requestBody = {
            object: 'item',
            storeId: formData.get('estoreId'),
            mid: formData.get('emid'),
            available: formData.get('eavailable') === 'on' // Convert checkbox value to boolean
        };
        sendRequestAdd(requestBody)
        
    });
    editAvailabilityFormCustom.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(editAvailabilityFormCustom);
        const requestBody = {
            object: 'custom',
            storeId: formData.get('estoreId'),
            mid: formData.get('emid'),
            option_name: formData.get('eoptionName'),
            custom_name: formData.get('eCustomName'),
            available: formData.get('eavailable') === 'on' // Convert checkbox value to boolean
        };
        sendRequestAdd(requestBody)
        
    });
    function sendRequestAdd(requestBody) {
        fetch('/menu/availability', {
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
