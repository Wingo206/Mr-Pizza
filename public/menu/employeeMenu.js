document.addEventListener('DOMContentLoaded', function () {
    const editAvailabilityForm = document.getElementById('availabilityForm');

    editAvailabilityForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(editAvailabilityForm);
        const requestBody = {
            object: formData.get('eobject'),
            storeId: formData.get('estoreId'),
            mid: formData.get('emid'),
            option_name: formData.get('eoptionName'),
            available: formData.get('eavailable') === 'on' // Convert checkbox value to boolean
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
