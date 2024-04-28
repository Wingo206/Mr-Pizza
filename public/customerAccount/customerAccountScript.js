async function deleteAccount(){
    let resp = await fetch('/deleteAccount', {
        method: 'DELETE'
    });
    console.log(resp);
    if (resp.status == 500){
        alert("Internal server error");
    }
    if (resp.status == 200){
        window.location.href = '../login/customerLogin.html';
        alert("Account successfully deleted");
    }
}

async function cancel(){
    window.location.href = "customerAccountDisplay.html"
}



async function addAccountInfo(){
    let default_delivery_address = document.getElementById('addDeliveryAddress').value;
    let phone_num = document.getElementById('addPhoneNumber').value;
    let email = document.getElementById('addEmail').value;
    let default_credit_card = document.getElementById('addPaymentMethod').value;
    let resp = await fetch('/customer/accountInfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({default_delivery_address: default_delivery_address, phone_num: phone_num, email: email, default_credit_card: default_credit_card})
    })

    console.log(resp);
    if (resp.status == 200){
        alert('Updated succesfully');
    }
    else {
        alert('No information to update');
    }
}

async function fetchCustomerInfo(){
    window.location.href = "customerAccount.html";
}
