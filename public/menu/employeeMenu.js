async function handleAvailabilityEditFormSubmit(event) {
    event.preventDefault();

    const object = document.getElementById('availability-object').value;
    const storeId = parseInt(document.getElementById('availability-store-id').value);
    const mid = parseInt(document.getElementById('availability-mid').value);
    const option_name = document.getElementById('availability-option-name').value;
    const available = document.getElementById('availability-available').checked;

    const employeeRequest = {
        object,
        storeId,
        mid,
        option_name,
        available
    };

    await editAvailabilityRequest(employeeRequest);
}

document.getElementById('availability-edit-form').addEventListener('submit', handleAvailabilityEditFormSubmit);
