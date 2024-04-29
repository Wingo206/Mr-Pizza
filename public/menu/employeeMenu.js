document.addEventListener('DOMContentLoaded', function () {
    const editAvailabilityForm = document.getElementById('editAvailabilityForm');

    editAvailabilityForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(editAvailabilityForm);
        const requestBody = {
            object: formData.get('object'),
            storeId: formData.get('storeId'),
            mid: formData.get('mid'),
            option_name: formData.get('optionName'),
            available: formData.get('available') === 'on' // Convert checkbox value to boolean
        };

        try {
            let resp = await fetch('/menu/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            if (!resp.ok) {
                throw new Error('Failed to update availability');
            }
            alert('Availability updated successfully!');
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while updating availability');
        }
    });
});
