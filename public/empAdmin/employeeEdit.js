async function addAccountInfo(){
    let email = document.getElementById('addEmail').value;
    let password_hash = document.getElementById('addPassword').value;

    let resp = await fetch('/employee/accountInfo', {
        method: 'POST',
        headers: {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify({email: email, password_hash: password_hash})
    });

    console.log(resp);
    if (resp.status == 200){
        alert("Employee account successfully updated");
    }
    else {
        alert("Error");
    }
}