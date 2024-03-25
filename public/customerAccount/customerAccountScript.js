const {customerPool, runQuery} = require("../../lib/util/database_util.js");

let cid;

window.addEventListener("load", async (event) => {
    console.log("page is fully loaded");
    refresh();
 });

 async function refresh(){
    let resp = await fetch('/custumerInfo', {
        method: 'GET'
    })
    let caInfo = await resp.json();
    console.log(caInfo);
    cid = caInfo.cid;
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
        alert('Error');
    }
}