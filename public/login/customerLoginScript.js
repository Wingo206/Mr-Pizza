const {customerPool, runQuery} = require("../../lib/util/database_util.js");


async function fetchRegister() {
   let username = document.getElementById('registerUsername').value;
   let password = document.getElementById('registerPassword').value;
   let resp = await fetch('/customer/register', {
      method: 'POST',
      headers: {
         "Content-type": 'application/json',
      },
      body: JSON.stringify({username: username, password: password})
   })
   console.log(resp);
   if (resp.status == 201) {
      alert('registered successfully.')
   } else if (resp.status == 409) {
      alert('Username is already used.')
   }
}

async function fetchLogin() {
   let username = document.getElementById('loginUsername').value;
   let password = document.getElementById('loginPassword').value;
   let resp = await fetch('/customer/login', {
      method: 'POST',
      headers: {
         "Content-type": 'application/json',
      },
      body: JSON.stringify({username: username, password: password})
   })
   console.log(resp);
   if (resp.status == 200) {
      // alert('logged in successfully. Redirecting to home page.')
      // let query = `SELECT cid FROM customer_account WHERE username = '${username}' AND password = '${password_hash}'`;
      // let customerCid = await runQuery(customerPool, query);
      // console.log(customerCid);
      window.location.href = '../customerAccount/customerAccount.html'

   } else if (resp.status == 401) {
      alert(await resp.text())
   } else {
      alert('Error.')
   }
}

async function signOut() {
   let resp = await fetch('/logout', {
      method: 'POST',
   })
   if (resp.status == 200) {
      alert('signed out')
   } else {
      alert('Error.')
   }
}
