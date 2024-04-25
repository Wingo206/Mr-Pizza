async function handleEditMenuFormSubmit(event) {
    event.preventDefault();

    const object = document.getElementById('edit-object').value;
    const action = document.getElementById('edit-action').value;
    const mid = parseInt(document.getElementById('edit-mid').value);
    const name = document.getElementById('edit-name').value;
    let property, newValue;
    if (action === 'edit') {
        property = document.getElementById('edit-property').value;
        newValue = document.getElementById('edit-new-value').value;
    }

    const adminRequest = {
        object,
        property,
        action,
        mid,
        name,
        newValue
    };

    await editMenuRequest(adminRequest);
}

async function handleAddMenuFormSubmit(event) {
    event.preventDefault();

    const object = document.getElementById('add-object').value;
    const description = document.getElementById('add-description').value;
    const mid = parseInt(document.getElementById('add-mid').value);
    const price = parseFloat(document.getElementById('add-price').value);
    const image = document.getElementById('add-image').value;
    const item_name = document.getElementById('add-item-name').value;
    const category = document.getElementById('add-category').value;
    const available = document.getElementById('add-available').checked;

    const adminRequest = {
        object,
        description,
        mid,
        price,
        image,
        item_name,
        category,
        available
    };

    await addToMenuRequest(adminRequest);
}

document.getElementById('edit-menu-form').addEventListener('submit', handleEditMenuFormSubmit);
document.getElementById('add-menu-form').addEventListener('submit', handleAddMenuFormSubmit);
